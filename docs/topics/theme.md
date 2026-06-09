# 主题系统

`@xdd-zone/fifa` 和 `@xdd-zone/bobo` 当前使用 Catppuccin 主题。

## 主题 ID

当前支持这 4 个主题：

- `latte`
- `frappe`
- `macchiato`
- `mocha`

HTML 根节点通过 `data-theme` 切换主题。

## 相关文件

- `packages/catppuccin-theme/styles/core.css`
  Catppuccin 颜色变量。
- `packages/catppuccin-theme/styles/fifa.css`
  Fifa 使用的 Tailwind 语义 token。
- `packages/catppuccin-theme/styles/bobo.css`
  Bobo 使用的 Tailwind 语义 token 和背景变量。
- `apps/fifa/src/utils/theme.ts`
  写入 `data-theme`。
- `apps/fifa/src/utils/catppuccin.antd.ts`
  从共享主题包导出 Ant Design 主题配置。
- `apps/bobo/lib/theme.ts`
  写入 `data-theme`，并保留 Bobo 的本地存储 key。

## 常用语义类

### 背景

- `bg-surface`
- `bg-surface-muted`
- `bg-surface-subtle`
- `bg-surface-1`
- `bg-surface-elevated`

### 文字

- `text-fg`
- `text-fg-subtle`
- `text-fg-muted`

### 边框

- `border-border`
- `border-border-subtle`

### 状态和强调

- `text-primary` / `bg-primary`
- `text-success` / `bg-success`
- `text-warning` / `bg-warning`
- `text-info` / `bg-info`
- `text-danger` / `bg-danger`
- `bg-overlay-0`

## 怎么切主题

```ts
import { updateThemeAttribute } from '@fifa/utils/theme'

updateThemeAttribute('mocha')
updateThemeAttribute('latte')
```

## Ant Design 主题

Ant Design 主题统一在这里生成：

- `packages/catppuccin-theme/src/antd.ts`

页面里不要自己拼一套新的 token。

## 当前约定

- 优先使用现有语义类，不直接写一套平行颜色方案
- 菜单、抽屉、表格、表单和页面容器尽量保持同一层级
- 暗色主题通过现有变量切换，不单独维护另一套页面写法

## 要排查主题问题时先看哪几处

1. `data-theme` 是否正确写到根节点
2. 语义类是否写对
3. app 是否导入了对应的 `@xdd-zone/catppuccin-theme/styles/*.css`
4. Ant Design 主题配置是否跟着切了
5. 是否有页面自己写死了颜色
