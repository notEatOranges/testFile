# 代码质量检查与提交校验

本项目配置了严格的代码质量检查，确保代码风格一致性和质量。

## 🔍 代码检查命令

### 检查代码问题
```bash
# 检查 JavaScript/JSX 代码
npm run lint

# 检查样式代码
npm run lint:style

# 检查所有代码
npm run lint:all
```

### 自动修复代码问题
```bash
# 修复 JavaScript/JSX 代码问题
npm run lint:fix

# 修复样式代码问题
npm run lint:style:fix

# 修复所有代码问题
npm run lint:all:fix

# 使用便捷脚本修复所有问题
npm run fix
```

## 🚫 提交校验

项目配置了 Git hooks，在每次提交代码时会自动进行以下检查：

1. **ESLint 检查** - 检查 JavaScript/JSX 代码规范
2. **Stylelint 检查** - 检查 CSS/SCSS/Sass 代码规范

如果检查失败，提交将被阻止。请修复所有问题后重新提交。

### 提交流程

```bash
# 1. 添加文件到暂存区
git add .

# 2. 提交代码（会自动运行检查）
git commit -m "你的提交信息"

# 如果检查失败，会看到错误信息
# 修复问题后重新提交
```

## 🔧 常见问题解决

### 如果提交被阻止

1. **查看错误信息** - 提交时会显示具体的错误位置
2. **自动修复** - 运行 `npm run fix` 自动修复大部分问题
3. **手动修复** - 根据错误信息手动修复剩余问题
4. **重新提交** - 修复完成后重新提交

### 跳过检查（不推荐）

如果确实需要跳过检查（紧急情况），可以使用：

```bash
git commit -m "紧急修复" --no-verify
```

⚠️ **注意**：请谨慎使用此选项，确保后续会修复代码问题。

## 📋 检查规则

### ESLint 规则
- 基于 `@yt/eslint-config` 配置
- 支持 React 18 语法
- 检查代码风格、潜在错误等

### Stylelint 规则
- 基于 `@yt/stylelint-config` 配置
- 检查 CSS/SCSS/Sass 代码规范
- 确保样式代码一致性

## 💡 开发建议

1. **编辑器配置** - 建议在编辑器中启用 ESLint 和 Stylelint 插件
2. **保存时检查** - 配置编辑器在保存时自动修复代码
3. **定期检查** - 定期运行 `npm run lint:all` 检查整个项目
4. **团队协作** - 确保团队成员都了解这些检查规则

## 🛠️ 配置说明

- **Husky** - Git hooks 管理
- **lint-staged** - 只检查暂存区的文件
- **ESLint** - JavaScript 代码检查
- **Stylelint** - 样式代码检查

配置文件：
- `.husky/pre-commit` - 提交前检查脚本
- `eslint.config.js` - ESLint 配置
- `.stylelintrc.js` - Stylelint 配置
- `package.json` - 脚本命令和 lint-staged 配置 