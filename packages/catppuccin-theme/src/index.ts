export { getPrimaryColorByTheme, getThemeById, getThemeColors } from './palette'
export type { CatppuccinColor, CatppuccinTheme } from './palette'

export const THEMES = ['latte', 'frappe', 'macchiato', 'mocha'] as const

export type ThemeName = (typeof THEMES)[number]

export const DEFAULT_THEME: ThemeName = 'latte'

export function isThemeName(value: string | null | undefined): value is ThemeName {
  return typeof value === 'string' && THEMES.includes(value as ThemeName)
}

export function resolveTheme(value: string | null | undefined): ThemeName {
  return isThemeName(value) ? value : DEFAULT_THEME
}

export function getNextTheme(theme: ThemeName): ThemeName {
  const index = THEMES.indexOf(theme)

  return THEMES[(index + 1) % THEMES.length]
}

export function applyTheme(theme: ThemeName, root: HTMLElement = document.documentElement) {
  root.dataset.theme = theme
}

export function isDarkTheme(themeId: string): boolean {
  return ['frappe', 'macchiato', 'mocha'].includes(themeId)
}
