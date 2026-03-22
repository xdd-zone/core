import type { MarkdownTheme } from './types'

import { useContext } from 'react'

import { MarkdownThemeContext } from './context'

/**
 * useMarkdownTheme：读取当前上下文中的 Markdown 主题
 * - 返回 `MarkdownTheme`，供组件合并类名
 */
export const useMarkdownTheme = (): MarkdownTheme => useContext(MarkdownThemeContext)
