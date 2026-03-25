import type { CatppuccinThemeId } from './catppuccin'

import { useContext } from 'react'

import { MarkdownCatppuccinThemeContext } from './context'

export function useCatppuccinTheme(): CatppuccinThemeId {
  return useContext(MarkdownCatppuccinThemeContext)
}
