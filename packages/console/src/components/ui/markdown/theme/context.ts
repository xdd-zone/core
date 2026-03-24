import type { CatppuccinThemeId } from './catppuccin'
import type { MarkdownTheme } from './types'

import { createContext } from 'react'

import { DEFAULT_CATPPUCCIN_THEME } from './catppuccin'
import { defaultMarkdownTheme } from './default'

/**
 * MarkdownThemeContext：提供主题对象上下文，默认值为内置主题
 */
export const MarkdownThemeContext = createContext<MarkdownTheme>(defaultMarkdownTheme)

/**
 * MarkdownCatppuccinThemeContext：提供代码高亮所需的 Catppuccin 主题 ID
 */
export const MarkdownCatppuccinThemeContext = createContext<CatppuccinThemeId>(DEFAULT_CATPPUCCIN_THEME)
