import type { ReactNode } from 'react'

export interface HeadingTheme {
  anchor: string
  h1: string
  h2: string
  h3: string
  h4: string
  h5: string
  h6: string
}

export interface TableTheme {
  container: string
  table: string
  tbody: string
  td: string
  th: string
  thead: string
  tr: string
}

export interface CodeTheme {
  container: string
  copyButton: string
  pre: string
}

export interface InlineTheme {
  code: string
  del: string
  em: string
  strong: string
}

export interface ListTheme {
  li: string
  ol: string
  ul: string
}

export interface BlockquoteTheme {
  blockquote: string
}

export interface ImageTheme {
  img: string
}

export interface HrTheme {
  hr: string
}

export interface ParagraphTheme {
  p: string
}

export interface AnchorTheme {
  a: string
}

/**
 * MarkdownTheme：用于描述所有 Markdown 组件使用的样式类名集合
 * - 每个字段对应一个子模块主题接口，用于统一样式命名
 * - 组件通过 `useMarkdownTheme()` 读取这些类名并应用到 DOM
 */
export interface MarkdownTheme {
  anchor: AnchorTheme
  blockquote: BlockquoteTheme
  code: CodeTheme
  container: string
  heading: HeadingTheme
  hr: HrTheme
  image: ImageTheme
  inline: InlineTheme
  list: ListTheme
  paragraph: ParagraphTheme
  table: TableTheme
}

export interface MarkdownThemeProviderProps {
  children: ReactNode
  theme?: MarkdownTheme
}
