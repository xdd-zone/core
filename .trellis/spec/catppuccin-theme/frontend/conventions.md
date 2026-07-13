# Catppuccin Theme

- 四套调色板由 `src/palette.ts` 管理，查找主题使用 `getThemeById`。
- CSS 变量以 `styles/core.css` 为基础；Bobo 和 Fifa 分别从 `styles/bobo.css`、`styles/fifa.css` 引入语义变量。
- `src/antd.ts` 负责 Ant Design token。改颜色时同时检查亮色和三套深色 token。
- 新导出要同时更新 `src/index.ts` 和 `package.json` 的 `exports`。

检查：`pnpm --dir packages/catppuccin-theme type-check && pnpm lint && pnpm --dir packages/catppuccin-theme format:check`。
