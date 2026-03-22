import type { ReactNode } from 'react'

import type { MarkdownThemeProviderProps } from './types'

import { MarkdownThemeContext } from './context'
import { defaultMarkdownTheme } from './default'

function MarkdownThemeProvider({ children, theme }: MarkdownThemeProviderProps): ReactNode {
  const value = theme ?? defaultMarkdownTheme
  return <MarkdownThemeContext.Provider value={value}>{children}</MarkdownThemeContext.Provider>
}

export { MarkdownThemeProvider }
