import type { MarkdownTheme } from './types'

import { createContext } from 'react'

import { defaultMarkdownTheme } from './default'

/**
 * MarkdownThemeContext：提供主题对象上下文，默认值为内置主题
 */
export const MarkdownThemeContext = createContext<MarkdownTheme>(defaultMarkdownTheme)
