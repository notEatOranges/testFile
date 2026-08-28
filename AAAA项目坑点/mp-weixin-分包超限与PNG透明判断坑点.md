# mp-weixin：分包超 2MB 瘦身 + PNG 透明通道判断（转格式前必实测 alpha；WebP 真机不显示）

> 适用：uni-app / 原生微信小程序（mp-weixin），HBuilderX 工程。凡涉及「代码包/分包超限」「图片格式转换/压缩」。

## 现象

上传/预览报：

```
Error: 代码包大小超过限制,subpackage /xxx/ source size 2442KB exceed max limit 2048KB
```

单个分包源码 > 2MB 被拒，无法预览/上传。

## 根因

**一、体积规则**：微信小程序**单个分包源码 ≤ 2MB**（整包 ≤ 20MB）。分包大小 = 该分包 root 目录下**所有物理文件大小之和**——不论是否被代码引用，废弃的、忘了删的大图照样算体积。

**二、瘦身时的 PNG 透明判断是暗坑**：
- PNG 编码为 `rgba`（带 alpha 通道）**不代表「真有透明」**——大量导出工具默认输出 32bit RGBA，但 alpha 全 255（未使用，视觉完全不透明）。
- 反之，有些图 alpha **被实际使用**：圆角外侧、外圈投影阴影、半透明过渡。这类图视觉上「主体铺满」，肉眼看「背景不透明」极易漏判（多模态图像分析同样会漏判边缘半透明阴影）。
- 错判后果：把「有透明」的图转成 **JPG（无 alpha 通道）** → 透明/半透明区域（圆角外、阴影）变成 JPG 解码默认填充色（黑或白硬边色块），容器阴影报废；这是**真机才显现**的视觉破坏，代码层无任何报错，极具迷惑性。

## 正确写法

**1. 定位大户**：按目录聚合文件大小，找 TOP。

```powershell
# 单个分包总量
$total = (Get-ChildItem "packageXxx" -Recurse -File | Measure-Object Length -Sum).Sum
# 按叶子目录聚合找大户
Get-ChildItem "packageXxx" -Recurse -File | Group-Object { Split-Path $_.DirectoryName -Leaf } |
  Sort-Object @{E={($_.Group | Measure-Object Length -Sum).Sum}} -Descending
```

常见大头：整包 `echarts.min.js`（~1MB，走按需打包，见《mp-weixin-echarts按需打包坑点》）、未压缩的 PNG 插画/大背景（单张数百 KB）。

**2. 转/压图片前，先实测 alpha 是否被使用**（不要靠肉眼/视觉分析）：

```powershell
# 转 WebP 后看编码：yuva420p = 有透明(保留alpha) / yuv420p = 无透明
ffmpeg -hide_banner -i out.webp 2>&1 | Select-String 'Stream .*Video'
# 或导出 alpha 灰度图肉眼看（全白=无透明，有黑/灰=有透明）
ffmpeg -i in.png -vf alphaextract alpha.png
```

**3. 按透明结果选格式（mp-weixin 优先 PNG，慎用 WebP）**：
- **有透明** → `PNG`（首选）。**绝不能用 JPG**（无 alpha，透明区变黑/白块）。
- **无透明** → `PNG` 减色压缩 或 `JPG`。
- ⚠️ **WebP 在 mp-weixin 真机可能不显示**（本项目实测：开发者工具正常、真机图不渲染）。项目历史 commit 把 WebP 全换回 PNG/JPG，**真因很可能就是真机 WebP 不显示**（不是布局塌陷）。**默认不要用 WebP**，除非已在目标真机逐张验证。

**4. PNG 瘦身首选「无损减色压缩」（保透明 + 真机零兼容问题）**：
- 工具：**TinyPNG / pngquant**（有损减色，视觉几乎无损，插画类可省 70-90%）或 oxipng（无损 zopfli）。
- ffmpeg 转 WebP 仅在「已真机验证 WebP 可用」时才考虑：`ffmpeg -y -i in.png -c:v libwebp -lossless 0 -q:v 75 out.webp`。

## 诊断

1. 报错信息直接给出超限的分包 root 和大小 → 对该 root 跑上面的聚合命令找大户。
2. 转格式后图片「真机圆角/阴影变黑/白色块」= 误把透明图转成了 JPG；`ffmpeg -i x.webp` 看 `yuva`/`yuv` 确认 alpha 是否保留。
3. 真机图片不显示（开发者工具正常）= 八成是 WebP，换回 PNG。
4. 分包仍超 = 有废弃未引用的大文件未删（物理文件不管引用都算体积）。

## 本项目实例

翼动同行（school-parent-mp）：`packageFeature` 分包 2481KB 超 2MB。大户：`static/echarts.min.js` 999KB（test-report 用）+ recipe 新增 PNG：`illu.png` 512KB、`week-panel.png` 282KB 等。

**翻车链（两次，皆被用户当场纠正）**：
1. 误判 week-panel「不透明」转 **JPG** → 漏掉它的圆角外侧+外圈阴影是透明/半透明（真机报废）。教训：rgba≠有透明、视觉铺满≠无透明，**转格式前必须实测 alpha**。
2. 改转 **WebP**（保透明、体积骤降 illu 512→19.6KB）→ **真机不显示**（开发者工具正常）。教训：**WebP 在 mp-weixin 真机不可靠，本项目已实测不渲染**。

**最终正解**：recipe PNG 走 **TinyPNG 无损减色压缩**（保透明 + 真机零问题）：`illu` 512→128KB、`week-panel` 282→38KB、`today` 54.6→15KB 等；echarts 走按需打包（999.6→513.8KB，见《mp-weixin-echarts按需打包坑点》）。分包 2481→1297KB 达标。

**核心教训**：① 转格式前实测 alpha；② mp-weixin 图片瘦身优先 **PNG 无损压缩**，**别用 WebP**（真机风险）；③ 大库（echarts）走按需打包，别靠图片格式硬省。
