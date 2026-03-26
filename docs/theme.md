# 主题系统

## 主题方案

`@xdd-zone/console` 使用 [Catppuccin](https://github.com/catppuccin/catppuccin) 配色方案，配合 TailwindCSS v4 的 `@theme` 机制管理主题。

支持的主题：

| 主题      | ID          | 类型             |
| --------- | ----------- | ---------------- |
| Latte     | `latte`     | 亮色（默认）     |
| Frappé    | `frappe`    | 暗色             |
| Macchiato | `macchiato` | 暗色             |
| Mocha     | `mocha`     | 暗色（默认暗色） |

主题通过 HTML 根节点的 `data-theme` 属性切换，`dark` 变体覆盖所有深色 Catppuccin 主题。

## 颜色命名规范

基于 [Catppuccin 官方风格指南](https://github.com/catppuccin/catppuccin/blob/main/docs/style-guide.md)，项目使用语义化命名。

### 背景颜色

| 功能       | 类名                | Catppuccin 变量   |
| ---------- | ------------------- | ----------------- |
| 主背景     | `bg-surface`        | `--ctp-base`      |
| 次级背景   | `bg-surface-muted`  | `--ctp-mantle`    |
| 边框/细节  | `bg-surface-subtle` | `--ctp-crust`     |
| 表面元素 0 | `bg-surface-0`      | `--ctp-surface-0` |
| 表面元素 1 | `bg-surface-1`      | `--ctp-surface-1` |
| 表面元素 2 | `bg-surface-2`      | `--ctp-surface-2` |

> Base（主背景）-> Mantle（次级背景）-> Crust（边框/细节）构成背景层级。

### 文字颜色

| 功能     | 类名             | Catppuccin 变量   |
| -------- | ---------------- | ----------------- |
| 正文     | `text-fg`        | `--ctp-text`      |
| 次级文字 | `text-fg-subtle` | `--ctp-subtext-0` |
| 辅助文字 | `text-fg-muted`  | `--ctp-subtext-1` |

> Catppuccin 的 `subtext-0` 比 `subtext-1` 更接近正文色深度。

### 叠加状态

| 功能     | 类名                    | 说明     |
| -------- | ----------------------- | -------- |
| 悬停状态 | `hover:bg-overlay-0`    | 交互反馈 |
| 禁用状态 | `disabled:bg-overlay-1` | 禁用状态 |
| 选中状态 | `bg-overlay-2`          | 高亮选中 |

### 边框颜色

| 功能     | 类名                   | 说明     |
| -------- | ---------------------- | -------- |
| 默认边框 | `border-border`        | 普通边框 |
| 次级边框 | `border-border-subtle` | 细微边框 |

### 主色调

| 功能     | 类名                          | 说明     |
| -------- | ----------------------------- | -------- |
| 主色     | `text-primary` / `bg-primary` | 品牌主色 |
| 主色悬停 | `hover:text-primary-hover`    | 悬停状态 |
| 主色浅色 | `text-primary-light`          | 浅色变体 |

### 状态色

| 功能 | 类名                          | 说明     |
| ---- | ----------------------------- | -------- |
| 成功 | `text-success` / `bg-success` | 成功状态 |
| 警告 | `text-warning` / `bg-warning` | 警告状态 |
| 错误 | `text-error` / `bg-error`     | 错误状态 |
| 信息 | `text-info` / `bg-info`       | 信息提示 |

### Catppuccin 调色板

项目完整支持 Catppuccin 所有颜色：

| 类名                              | 说明     |
| --------------------------------- | -------- |
| `text-rosewater` / `bg-rosewater` | 玫瑰水红 |
| `text-flamingo` / `bg-flamingo`   | 火烈鸟粉 |
| `text-pink` / `bg-pink`           | 粉色     |
| `text-mauve` / `bg-mauve`         | 紫藤     |
| `text-red` / `bg-red`             | 红色     |
| `text-maroon` / `bg-maroon`       | 栗色     |
| `text-peach` / `bg-peach`         | 桃色     |
| `text-yellow` / `bg-yellow`       | 黄色     |
| `text-green` / `bg-green`         | 绿色     |
| `text-teal` / `bg-teal`           | 青色     |
| `text-sky` / `bg-sky`             | 天蓝色   |
| `text-blue` / `bg-blue`           | 蓝色     |
| `text-sapphire` / `bg-sapphire`   | 蓝宝石   |
| `text-lavender` / `bg-lavender`   | 薰衣草紫 |

## 兼容类名

为兼容第三方组件库（如 shadcn/ui），同时提供标准语义名：

| 功能   | 语义类名        | 兼容类名                               |
| ------ | --------------- | -------------------------------------- |
| 主背景 | `bg-surface`    | `bg-background`                        |
| 正文   | `text-fg`       | `text-foreground`                      |
| 辅助   | `text-fg-muted` | `text-muted` / `text-muted-foreground` |
| 边框   | `border-border` | `border`                               |

## 使用示例

```tsx
// 卡片组件
function Card() {
  return (
    <div className="bg-surface border-border rounded-lg border p-4">
      <h2 className="text-fg text-xl font-bold">标题</h2>
      <p className="text-fg-muted mt-2">描述文本</p>
      <button className="bg-primary mt-4 rounded px-4 py-2 text-white">确认</button>
    </div>
  )
}

// 表格行交替
function TableRow({ index }: { index: number }) {
  return (
    <tr className={index % 2 === 0 ? 'bg-surface-1' : 'bg-surface-2'}>
      <td className="text-fg p-3">内容</td>
    </tr>
  )
}

// 悬停交互
function ListItem() {
  return <li className="hover:bg-overlay-0 rounded p-2 transition-colors">列表项</li>
}
```

## 主题切换

```tsx
import { updateThemeAttribute } from '@console/utils/theme'

// 切换到 Mocha 暗色主题
updateThemeAttribute('mocha')

// 切换到 Latte 亮色主题
updateThemeAttribute('latte')
```

## 文件位置

```text
packages/console/src/assets/styles/theme/
├── catppuccin.css    # Catppuccin 颜色变量定义
├── variables.css     # TailwindCSS @theme 映射
└── dark-mode.css     # 暗色模式配置
```

相关位置：

- [packages/console/src/assets/styles/theme/catppuccin.css](../packages/console/src/assets/styles/theme/catppuccin.css)
- [packages/console/src/assets/styles/theme/variables.css](../packages/console/src/assets/styles/theme/variables.css)
- [packages/console/src/assets/styles/theme/dark-mode.css](../packages/console/src/assets/styles/theme/dark-mode.css)
- [packages/console/src/utils/theme.ts](../packages/console/src/utils/theme.ts)
- [packages/console/src/utils/catppuccin.antd.ts](../packages/console/src/utils/catppuccin.antd.ts)

## 相关阅读

- [console.md](./console.md)
- [architecture.md](./architecture.md)
- [Catppuccin 官方仓库](https://github.com/catppuccin/catppuccin)
- [Catppuccin 风格指南](https://github.com/catppuccin/catppuccin/blob/main/docs/style-guide.md)
- [TailwindCSS v4 Theme](https://tailwindcss.com/docs/theme)
