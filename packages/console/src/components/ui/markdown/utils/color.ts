export interface RgbColor {
  b: number
  g: number
  r: number
}

/**
 * 将十六进制颜色转换为 RGB 值
 */
export function hexToRgb (hex: string): RgbColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        b: Number.parseInt(result[3], 16),
        g: Number.parseInt(result[2], 16),
        r: Number.parseInt(result[1], 16),
      }
    : null
}
