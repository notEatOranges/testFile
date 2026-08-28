# Claude Code Skills 自动加载机制与 SKILL.md 规范坑点

## 现象

在项目 `.claude/skills/` 下写好一堆 skill 后，不确定"写法对不对、能不能自动读取"；skill 正文里还留着旧版 `/skill xxx "参数"` 的调用写法，README 索引里写的是平铺文件名（`xxx.md`），与实际目录结构（`xxx/SKILL.md`）对不上。

## 通用规则（Claude Code Skills 正确姿势）

1. **目录结构**：每个 skill 一个文件夹，内放一个 `SKILL.md`：
   ```
   .claude/skills/<skill-name>/SKILL.md
   ```
   平铺的 `.claude/skills/xxx.md` 不会被注册为 skill。

2. **Frontmatter 必须有 `name` + `description`**：
   - `name` 用 kebab-case，与文件夹名一致
   - `description` 是触发的唯一依据，要写清"干什么 + 什么时候用"（例：当需要写列表页、弹窗表单时使用）。description 写得含糊，skill 就永远不被触发。

3. **自动加载是两段式，不是读全文**：
   - 每个会话只自动加载所有 skill 的 `name + description` 进上下文
   - 正文（SKILL.md 其余内容）只在触发时才被读取：用户输入 `/技能名`，或模型判断当前任务匹配某个 description 时自动调用
   - 所以"正文里写再多规则，description 没写好也白搭"

4. **调用语法是 `/技能名`，不带参数**：
   - ✅ `/pbsf-list-page`
   - ❌ `/skill pbsf-list-page "车辆信息"`（旧版/杜撰写法，skills 不接受这种传参；需求参数直接写在对话里）

5. **`.claude/skills/` 下的 README.md 无害**：没有 frontmatter、不在子文件夹里，不会被误注册为 skill，可以放心当索引用。但索引要和实际结构同步：
   - 索引表里的"文件"列应写 `<skill-name>/SKILL.md`，不是 `<skill-name>.md`
   - 新增/改名/删除 skill 后必须同步更新索引，否则索引过时误导检索

6. **跨项目复制 skill 时检查相对链接**：skill 正文里的 `../../xxx.js` 相对链接是相对该 SKILL.md 所在路径解析的，复制到另一个仓库后会指向不存在的文件。复制后要么改链接，要么删链接只留文字说明。

## 本项目实例

- 项目：maoming-backend-q（PBSF pnpm workspace 前端）
- 路径：`.claude/skills/`（19 个 skill，规范 PBSF 页面生成）
- 踩的坑：
  - 9 个 SKILL.md 里写了旧语法 `/skill pbsf-xxx "参数"`，已全部改为 `/pbsf-xxx`
  - `.claude/skills/README.md` 索引表"文件"列写的是 `pbsf-xxx.md` 平铺名，已改为 `pbsf-xxx/SKILL.md`，并补上遗漏的 `pbsf-upload`、`page-data-mock` 两行
  - `page-data-mock` 疑似从小程序项目复制而来，正文相对链接（`common/request.js`、`apis/sportTask.js`、`hooks/useDict.js`、`subpackages/geling/`）在本仓库不存在
- 维护约定：该项目的 skills/README.md 末尾写明"新增或修改任何 skill 后必须同步更新 README 索引"。
