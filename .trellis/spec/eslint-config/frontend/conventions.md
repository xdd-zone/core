# ESLint Config

- 公共 ESLint 入口是 `index.js` 的 `createEslintConfig`，应用从包根导入。
- 忽略项集中在 `baseIgnores`；新增构建产物或生成文件时只加这里。
- Prettier 配置只在 `prettier.config.js` 维护，当前规则是 120 列、单引号、无分号、尾逗号。
- 改规则后运行根目录 `pnpm lint` 和 `pnpm format:check`，不要只检查配置包。
