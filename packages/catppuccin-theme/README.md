# @xdd-zone/catppuccin-theme

`@xdd-zone/catppuccin-theme` 放 Fifa 和 Bobo 共用的 Catppuccin 主题。

这个包提供两类内容：

- CSS 主题入口，给 app 的全局样式文件导入。
- TypeScript 函数，给 app 读取主题名、色板、主色和 Ant Design 主题配置。

## 文件位置

- `styles/core.css`
  放 `data-theme` 会切换的 Catppuccin 颜色变量。
- `styles/fifa.css`
  给 Fifa 用，包含 Fifa 需要的 Tailwind 语义 token。
- `styles/bobo.css`
  给 Bobo 用，包含 Bobo 需要的 Tailwind 语义 token 和背景变量。
- `src/index.ts`
  导出主题名、默认主题、主题判断和 `data-theme` 写入函数。
- `src/palette.ts`
  导出四个主题的色板和主色读取函数。
- `src/color.ts`
  导出十六进制颜色转换和混色函数。
- `src/antd.ts`
  导出 Fifa 使用的 Ant Design 主题配置。

## CSS 用法

Bobo 在 `apps/bobo/app/globals.css` 引入：

```css
@import '@xdd-zone/catppuccin-theme/styles/bobo.css';
```

Fifa 在 `apps/fifa/src/assets/styles/index.css` 引入：

```css
@import '@xdd-zone/catppuccin-theme/styles/fifa.css';
```

如果只需要运行时颜色变量，可以单独引入：

```css
@import '@xdd-zone/catppuccin-theme/styles/core.css';
```

## TypeScript 用法

主题名和 `data-theme` 写入函数从包根入口引入：

```ts
import { applyTheme, DEFAULT_THEME, resolveTheme, THEMES } from '@xdd-zone/catppuccin-theme'
```

色板从 `palette` 子路径引入：

```ts
import { catppuccinThemes, getPrimaryColorByTheme } from '@xdd-zone/catppuccin-theme/palette'
```

颜色工具从 `color` 子路径引入：

```ts
import { hexToRgba } from '@xdd-zone/catppuccin-theme/color'
```

Ant Design 主题配置只给 Fifa 用：

```ts
import { getAntdThemeConfig } from '@xdd-zone/catppuccin-theme/antd'
```

Bobo 不要引入 `@xdd-zone/catppuccin-theme/antd`。

## 当前主题

当前支持四个主题：

- `latte`
- `frappe`
- `macchiato`
- `mocha`

HTML 根节点通过 `data-theme` 切换主题。

## 检查命令

在仓库根目录执行：

```bash
pnpm --filter @xdd-zone/catppuccin-theme build
pnpm --filter @xdd-zone/catppuccin-theme type-check
pnpm --filter @xdd-zone/catppuccin-theme lint
pnpm --filter @xdd-zone/catppuccin-theme format:check
```
