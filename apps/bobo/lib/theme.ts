import { isThemeName as isThemeNameImport } from '@xdd-zone/catppuccin-theme'

export const THEME_STORAGE_KEY = 'xdd-bobo-theme'

export {
  applyTheme,
  getNextTheme,
  isDarkTheme,
  isThemeName,
  THEMES,
} from '@xdd-zone/catppuccin-theme'
export type { ThemeName } from '@xdd-zone/catppuccin-theme'

export const DEFAULT_THEME = 'macchiato'

export function resolveTheme(value: string | null | undefined) {
  return isThemeNameImport(value) ? value : DEFAULT_THEME
}
