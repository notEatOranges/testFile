# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在处理此代码库时提供指导。

## 常用命令

- **启动开发服务器**: `pnpm dev`
- **生产环境构建**: 本项目有多个针对不同客户端的构建目标。请使用 `package.json` 中对应的命令。例如，`pnpm build:prod` 是通用的生产构建命令，而 `pnpm build:qhfx` 是针对特定客户端的。`pnpm build:All` 用于构建所有目标。
- **代码规范检查**:
  - `pnpm lint:eslint`: 检查并修复 JavaScript/TypeScript 和 Vue 文件。
  - `pnpm lint:stylelint`: 检查并修复样式文件。

## 高层架构

这是一个使用 `pnpm` 工作空间的 Vue 3 monorepo 项目。

- **`packages/`**: 此目录包含作为独立包的不同应用程序。
  - `app-base`: 包含核心的系统管理功能。
  - `app-manage`: 包含业务特定的模块。
- **`src/`**: 这是主要的应用程序源代码目录。
  - **`src/router/`**: 定义了应用程序的路由。
  - **`src/store/`**: 使用 Pinia 进行状态管理。
  - **`src/api/`**: 包含了所有按模块组织的 API 请求定义。
  - **`src/views/`**: 包含页面组件。
- **构建配置**: 项目使用 Vite。构建过程为多个客户端进行了定制，并带有在 `.env.*` 文件中的环境特定配置。`script/buildAll.mjs` 脚本用于一次性为所有客户端进行构建。

## API 文档

详细的 API 文档位于 `docs/school-sport-business.md` 文件中。当被问及 API 端点、参数或其他细节时，请查阅此文件以获取准确信息。
