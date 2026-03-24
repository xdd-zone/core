import { Markdown } from '@console/components/ui'
import { useSettingStore } from '@console/stores/modules/setting'
import { getPrimaryColorByTheme } from '@console/utils/theme'

const text = `
# Markdown 全量预览

这是一段普通的文本，包含一些 **加粗**、*斜体*、以及 \`行内代码\`，也支持 ~~删除线~~ 与自动链接 https://shiki.style/themes。

---

## 标题层级

### H3 标题

#### H4 标题

##### H5 标题

###### H6 标题

---

## 列表

### 无序列表

- 列表项 1（包含 **强调** 与 *斜体*）
- 列表项 2
  - 嵌套列表项 2.1
  - 嵌套列表项 2.2（含 ~~删除线~~）

### 有序列表

1. 第一项
2. 第二项
3. 第三项（含 \`inline code\`）

### 任务清单（GFM）

- [x] 已完成任务
- [ ] 待办任务 A
- [ ] 待办任务 B

---

## 表格（GFM）

| 名称 | 描述 | 数量|
| :--- | :--: | ---: |
| 苹果 | 红色 |    3 |
| 香蕉 | 黄色 |    5 |
| 葡萄 | 紫色 |   12 |

---

## 引用与嵌套

> "Stay hungry, stay foolish."
>
> — Steve Jobs
>
> 嵌套段落：**加粗** 与 *斜体* 混合。

---

## 图片与链接

![占位图](http://localhost:2333/src/assets/images/sullyoon.jpg "占位图标题")

外部链接：[访问我的 GitHub](https://github.com "GitHub")，以及自动链接 https://example.com。

---

## 代码块（JavaScript）

\`\`\`javascript
function greet(name) {
  return 'Hello, ' + name + '!'
}

console.log(greet('World'))
\`\`\`

## 代码块（TypeScript）

\`\`\`typescript
type User = {
  id: number
  name: string
}

function hello(u: User): string {
  return 'Hello, ' + u.name
}

console.log(hello({ id: 1, name: 'TS' }))
\`\`\`

## 代码块（JSON）

\`\`\`json
{
  "name": "xdd-space",
  "version": "0.0.1",
  "features": ["markdown", "gfm", "shiki"],
  "link": "https://github.com/xdd-space"
}
\`\`\`

## 代码块（bash）

\`\`\`bash
pnpm i
pnpm -C apps/admin dev
\`\`\`
`

/**
 * Markdown 示例页面
 */
export function MarkdownExample() {
  const { catppuccinTheme } = useSettingStore()
  const primaryColor = getPrimaryColorByTheme(catppuccinTheme)
  return (
    <div className="p-4">
      <Markdown value={text} accentColor={primaryColor} />
    </div>
  )
}
