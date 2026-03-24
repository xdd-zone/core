import type { ReactNode } from 'react'

import type { MarkdownThemeProviderProps } from './types'

import { DEFAULT_CATPPUCCIN_THEME } from './catppuccin'
import { MarkdownCatppuccinThemeContext, MarkdownThemeContext } from './context'
import { defaultMarkdownTheme } from './default'

function MarkdownThemeProvider({
  catppuccinTheme = DEFAULT_CATPPUCCIN_THEME,
  children,
  theme,
}: MarkdownThemeProviderProps): ReactNode {
  const value = theme ?? defaultMarkdownTheme
  return (
    <MarkdownThemeContext.Provider value={value}>
      <MarkdownCatppuccinThemeContext.Provider value={catppuccinTheme}>
        {children}
      </MarkdownCatppuccinThemeContext.Provider>
    </MarkdownThemeContext.Provider>
  )
}

export { MarkdownThemeProvider }
