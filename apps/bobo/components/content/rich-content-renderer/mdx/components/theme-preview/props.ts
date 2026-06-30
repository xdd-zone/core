import type { MdxRawProps } from '../../types'

export interface ThemePreviewProps {
  theme: string
}

const DEFAULT_THEME = 'latte'

export function parseThemePreviewProps(rawProps: MdxRawProps): MdxRawProps {
  return {
    theme: rawProps.theme ?? DEFAULT_THEME,
  }
}
