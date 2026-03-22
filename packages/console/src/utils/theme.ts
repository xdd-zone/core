import type { CatppuccinTheme } from '../config/catppuccin'

import { getThemeById } from '../config/catppuccin'

/**
 * 获取系统是否偏好暗黑模式
 */
export function getSystemPrefersDark (): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * 更新 HTML 元素的主题属性
 * @param themeId - Catppuccin 主题 ID (latte | frappe | macchiato | mocha)
 */
export function updateThemeAttribute (themeId: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', themeId)
  }
}

/**
 * 根据布尔值更新 HTML 元素的主题属性（兼容性函数）
 * @deprecated 请使用 updateThemeAttribute(themeId)
 */
export function updateThemeAttributeByBool (isDark: boolean) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', isDark ? 'mocha' : 'latte')
  }
}

/**
 * 将十六进制颜色转换为 RGB 值
 */
export function hexToRgb (hex: string): { b: number; g: number; r: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        b: Number.parseInt(result[3], 16),
        g: Number.parseInt(result[2], 16),
        r: Number.parseInt(result[1], 16),
      }
    : null
}

/**
 * 将十六进制颜色转换为 CSS RGB 值 并添加透明度
 */
export function hexToRgba (hex: string, alpha: number = 1): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return 'rgba(0, 0, 0, 0)'

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

/**
 * 将十六进制颜色转换为 HSL 值
 */
export function hexToHsl (hex: string): { h: number; l: number; s: number } | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null

  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    l: Math.round(l * 100),
    s: Math.round(s * 100),
  }
}

/**
 * 将 HSL 值转换为十六进制颜色
 */
export function hslToHex (h: number, s: number, l: number): string {
  l /= 100
  const a = (s * Math.min(l, 1 - l)) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/**
 * 混合两种颜色
 * @param color1 第一个颜色（十六进制）
 * @param color2 第二个颜色（十六进制）
 * @param ratio 混合比例（0-1），0 表示完全使用 color1，1 表示完全使用 color2
 */
export function mixColors (color1: string, color2: string, ratio: number): string {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) return color1

  const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio)
  const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio)
  const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * 生成颜色的 shades（深浅变化）
 * 使用白色和黑色混合生成类似 TailwindCSS 的颜色阶梯
 */
export function generateColorShades (color: string): Record<string, string> {
  const shades: Record<string, string> = {}

  // TailwindCSS 风格的颜色阶梯混合比例
  const ratios: Record<string, number> = {
    '50': 0.95,
    '100': 0.9,
    '200': 0.8,
    '300': 0.7,
    '400': 0.6,
    '500': 0.5,
    '600': 0.4,
    '700': 0.3,
    '800': 0.2,
    '900': 0.1,
  }

  // 使用白色生成浅色（50-400）
  for (const [shade, ratio] of Object.entries(ratios)) {
    if (Number.parseInt(shade) <= 500) {
      shades[shade] = mixColors('#ffffff', color, ratio)
    } else {
      // 使用黑色生成深色（600-900）
      shades[shade] = mixColors(color, '#000000', 1 - ratio)
    }
  }

  return shades
}

/**
 * 更新主题色的 CSS 自定义属性
 * 同时生成完整的颜色 shades 供 TailwindCSS 使用
 */
export function updatePrimaryColorAttribute (color: string) {
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
export function calculateIsDark (themeMode: 'light' | 'dark' | 'system'): boolean {
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
export function getCatppuccinThemeConfig (themeId: string): CatppuccinTheme | undefined {
  return getThemeById(themeId)
}

/**
 * 获取指定主题的主色（Blue）
 */
export function getPrimaryColorByTheme (themeId: string): string {
  const theme = getThemeById(themeId)
  const blueColor = theme?.colors.find((c) => c.name === 'Blue')
  return blueColor?.value || '#1e66f5'
}

/**
 * 判断主题是否为暗色主题
 */
export function isDarkTheme (themeId: string): boolean {
  return ['frappe', 'macchiato', 'mocha'].includes(themeId)
}
