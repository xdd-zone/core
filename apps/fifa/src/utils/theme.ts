import type { CatppuccinTheme } from '@xdd-zone/catppuccin-theme'

import { resolveTheme } from '@xdd-zone/catppuccin-theme'
import { generateColorShades, hexToRgb, mixColors } from '@xdd-zone/catppuccin-theme/color'
import { getThemeById } from '@xdd-zone/catppuccin-theme/palette'

export type { CatppuccinTheme, ThemeName } from '@xdd-zone/catppuccin-theme'
export { DEFAULT_THEME, getNextTheme, isDarkTheme, isThemeName, resolveTheme, THEMES } from '@xdd-zone/catppuccin-theme'
export {
  generateColorShades,
  hexToHsl,
  hexToRgb,
  hexToRgba,
  hslToHex,
  mixColors,
} from '@xdd-zone/catppuccin-theme/color'
export { getPrimaryColorByTheme, getThemeById, getThemeColors } from '@xdd-zone/catppuccin-theme/palette'

export const THEME_STORAGE_KEY = 'setting-store'

/**
 * 获取系统是否偏好暗黑模式
 */
export function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * 更新 HTML 元素的主题属性
 * @param themeId - Catppuccin 主题 ID (latte | frappe | macchiato | mocha)
 */
export function updateThemeAttribute(themeId: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = resolveTheme(themeId)
  }
}

/**
 * 根据布尔值更新 HTML 元素的主题属性（兼容性函数）
 * @deprecated 请使用 updateThemeAttribute(themeId)
 */
export function updateThemeAttributeByBool(isDark: boolean) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', isDark ? 'mocha' : 'latte')
  }
}

/**
 * 更新主题色的 CSS 自定义属性
 * 同时生成完整的颜色 shades 供 TailwindCSS 使用
 */
export function updatePrimaryColorAttribute(color: string) {
  if (typeof document !== 'undefined') {
    const rgb = hexToRgb(color)
    if (rgb) {
      const root = document.documentElement

      // 设置基础颜色变量（用于向后兼容）
      root.style.setProperty('--primary-color', color)
      root.style.setProperty('--primary-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)

      // 动态生成并设置颜色 shades（供 TailwindCSS @theme 使用）
      const shades = generateColorShades(color)
      for (const [shade, shadeColor] of Object.entries(shades)) {
        root.style.setProperty(`--color-primary-${shade}`, shadeColor)
        // 同时设置 950 shade
        if (shade === '900') {
          root.style.setProperty('--color-primary-950', mixColors(color, '#000000', 0.05))
        }
      }
    }
  }
}

/**
 * 根据主题模式计算实际的暗黑模式状态
 */
export function calculateIsDark(themeMode: 'light' | 'dark' | 'system'): boolean {
  switch (themeMode) {
    case 'dark':
      return true
    case 'light':
      return false
    case 'system':
      return getSystemPrefersDark()
    default:
      return false
  }
}

/**
 * 获取 Catppuccin 主题的完整配置
 */
export function getCatppuccinThemeConfig(themeId: string): CatppuccinTheme | undefined {
  return getThemeById(themeId)
}
