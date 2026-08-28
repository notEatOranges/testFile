# Docker 镜像 SCA 逐层扫描：上层 rm 删不掉基础层里的 pip/setuptools wheel

## 现象
基础镜像（如 `ctyunos-nginx`）自带 Python 残留（`pip-20.2.2.whl`、`setuptools-44.1.1.whl`），SCA 扫描报高危/中危。在 Dockerfile 里加 `RUN find / -name 'pip-*.whl' -delete` 等清理语句后：
- 进容器里 `find / -name '*.whl'` 确实找不到文件（合并文件系统层面已删）；
- 但平台重新扫描**依然告警**，组件名还原样带着 `.whl` 后缀报出来。

## 根因
平台 SCA 扫描器是**按镜像层（layer）逐层解包扫描**的，不是扫运行中容器的合并文件系统。Docker 的 `RUN rm` 只在上层产生 whiteout 标记（`.wh..wh..opq` / `.wh.<name>`），**基础镜像层 tar 包里的原文件一个字节都没动**。扫描器解到基础层照样识别出 wheel 并告警。

补充两个定位线索：
- `pip-20.2.2` + `setuptools-44.1.1` 正好是 CPython 3.8/3.9 `ensurepip/_bundled/` 的官方捆绑组合，藏在 `/usr/lib*/python3*/ensurepip/_bundled/`，普通"删 site-packages"清理常常漏掉它；
- 组件名带 `.whl` 后缀被报出 = 扫描器看到的是 wheel 文件本体（逐层解包实锤），而不是 dist-info 元数据。

## 修复：删干净 + `FROM scratch` 压平成单层
单纯删文件对逐层扫描无效，必须把含 wheel 的层从最终产物里抹掉。纯 Dockerfile 内自包含的方案是多阶段最后压平：

```dockerfile
# 倒数第二阶段：正常组装 + 删干净（带断言，删不干净直接构建失败）
FROM <基础镜像> AS runtime
COPY ... 
RUN set -eux; \
    find / -type f \( -name 'pip-*.whl' -o -name 'setuptools-*.whl' \) -delete 2>/dev/null || true; \
    rm -rf /root/.cache/pip /usr/share/python-wheels \
        /usr/lib/python3*/ensurepip /usr/lib64/python3*/ensurepip /usr/local/lib/python3*/ensurepip; \
    # ... 再清 dist-info/pkg_resources 等；最后断言：
    left="$(find / \( -path /proc -o -path /sys -o -path /dev \) -prune -o \
      -type f \( -name 'pip-*.whl' -o -name 'setuptools-*.whl' \) -print)" || true; \
    if [ -n "$left" ]; then echo "ERROR: wheel 未删干净:" $left >&2; exit 1; fi
USER appuser
CMD ["nginx", "-g", "daemon off;"]

# 最终阶段：FROM scratch + 整树 COPY → 单层镜像，基础层彻底消失
FROM scratch
COPY --from=runtime / /
USER appuser          # 元数据不会被 COPY 继承，须重申
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

## 验证方法（模拟扫描器逐层解包）
```bash
docker save <img> -o img.tar && mkdir x && tar -xf img.tar -C x
for lt in $(find x -name 'layer.tar' -o -path '*blobs/sha256/*' -type f); do
  tar -tf "$lt" 2>/dev/null | grep -E '(pip|setuptools)-[0-9].*\.whl' && echo "HIT: $lt"
done
```
实测对比（模拟 wheel 在 ensurepip/_bundled 与 /usr/share/python-wheels）：
- 清理但不压平（旧方案）：合并层干净，但基础层 tar 里仍能找到 3 个 wheel ❌
- 清理 + scratch 压平：所有层均无 wheel，镜像照常运行 ✅（`layers=1`）

## 要点
- `RUN rm` 改变的是合并文件系统，**不是层 tar 本身**；逐层扫描的平台面前等于没删。
- `COPY --from` 不继承 `USER`/`EXPOSE`/`CMD`/`ENV`/`ENTRYPOINT` 等元数据，scratch 阶段要逐条重申，否则容器以 root 跑或起不来。
- 清理脚本加"断言"（删完再 find 一遍，非空即 fail build）能防止未来基础镜像升级后新残留静默溜进产物。
- 替代方案：`docker export | docker import` 手动压平（需改 CI 流水线）；或用 BuildKit `--squash`。纯 Dockerfile 改动只有 scratch 方案。
- 潜在权衡：压平后失去层缓存与基础镜像溯源（`docker history` 只剩一层），扫描器如按"基础镜像 + 增量层"分层报告可能会改变展示形式；但 CVE 消除目标达成。

## 本项目实例
- Qsntypx-q（青少年智能培训管理系统前端，`Dockerfile`）：基础镜像 `ctyunos-nginx:v1.29.3`，修 CVE-2026-13346 等 12 项；上一次仅删文件（commit `72acbe6`）扫描仍报 `pip-20.2.2.whl`/`setuptools-44.1.1.whl`，本次加 scratch 压平修复。
- Tyzxyy-q（同仓库组另一前端，`Dockerfile`）：同款基础镜像同款漏洞，同步修复。
