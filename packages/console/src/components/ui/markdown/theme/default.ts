import type { MarkdownTheme } from './types'

export const defaultMarkdownTheme: MarkdownTheme = {
  // 链接样式：统一外链与文本强调颜色、交互
  anchor: {
    a: 'underline-offset-2 hover:underline text-primary!',
  },
  // 引用块：左侧强调条与浅色背景，提升区块可读性
  blockquote: {
    blockquote: 'my-4 rounded-lg border-l-4 border-primary bg-surface-muted p-4 italic text-fg',
  },
  // 代码块：容器、复制按钮与 `<pre>` 的样式
  code: {
    container: 'group relative my-4 rounded-lg bg-surface-muted overflow-hidden',
    copyButton:
      'absolute top-2 right-2 rounded-md border border bg-surface px-2 py-1 text-xs text-fg-muted opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer hover:bg-surface-muted',
    pre: 'w-fulloverflow-x-auto rounded-lg bg-surface-muted p-3 pb-10 text-sm text-fg',
  },
  // 全局容器：控制排版与选区样式
  container: 'prose max-w-none selection:bg-primary/30 selection:text-white text-fg',
  // 标题：分级字号与 hover 显示可复制锚点
  heading: {
    anchor: 'ml-2 opacity-0 group-hover:opacity-100 text-primary!',
    h1: 'mt-6 mb-3 text-3xl font-bold tracking-tight text-fg',
    h2: 'mt-5 mb-2 text-2xl font-semibold tracking-tight text-fg',
    h3: 'mt-4 mb-2 text-xl font-semibold text-fg',
    h4: 'mt-3 mb-1 text-lg font-semibold text-fg',
    h5: 'mt-3 mb-1 text-base font-semibold text-fg',
    h6: 'mt-3 mb-1 text-sm font-semibold uppercase tracking-wide text-fg',
  },
  // 分隔线：页面语义分隔
  hr: {
    hr: 'my-6 border-t border',
  },
  // 图片：默认响应式与圆角
  image: {
    img: 'my-4 h-auto max-w-full rounded-lg',
  },
  // 行内文本样式：代码、删除线、斜体、加粗
  inline: {
    code: 'rounded bg-surface-muted px-1.5 py-0.5 font-mono text-sm text-fg',
    del: 'text-fg-muted line-through decoration-rosewater',
    em: 'italic text-fg',
    strong: 'font-semibold text-fg',
  },
  // 列表：一致缩进与行高
  list: {
    li: 'leading-7 text-fg',
    ol: 'my-3 list-decimal flex flex-col gap-1 pl-6 text-fg',
    ul: 'my-3 list-disc flex flex-col gap-1 pl-6 text-fg',
  },
  // 段落：基础行高
  paragraph: {
    p: 'leading-7 text-fg',
  },
  // 表格：滚动容器与交替行背景
  table: {
    container: 'my-4 overflow-x-auto',
    table: 'w-full text-sm',
    tbody: '',
    td: 'border-b border p-2 text-left align-top text-fg',
    th: 'border-b border p-2 text-left font-medium text-fg',
    thead: 'bg-surface-muted',
    tr: 'odd:bg-transparent even:bg-surface-1',
  },
}
