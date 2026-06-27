import type { ThemeName as CatppuccinThemeName } from '@xdd-zone/catppuccin-theme'
import { isThemeName as isThemeNameImport } from '@xdd-zone/catppuccin-theme'

export const THEME_STORAGE_KEY = 'xdd-bobo-theme'

export {
  applyTheme,
  THEMES as CATPPUCCIN_THEMES,
  getNextTheme,
  isThemeName as isCatppuccinThemeName,
  isDarkTheme,
} from '@xdd-zone/catppuccin-theme'

export type ThemeSetting = CatppuccinThemeName | 'system'

export const DEFAULT_THEME_SETTING: ThemeSetting = 'system'
export const FALLBACK_DARK: CatppuccinThemeName = 'macchiato'
export const FALLBACK_LIGHT: CatppuccinThemeName = 'latte'

export function isThemeSetting(value: string | null | undefined): value is ThemeSetting {
  return value === 'system' || isThemeNameImport(value)
}

export function resolveThemeSetting(value: string | null | undefined): ThemeSetting {
  return isThemeSetting(value) ? value : DEFAULT_THEME_SETTING
}
