import type { MdxComponentDefinition } from '../../types'

import { ThemePreview } from '.'
import { parseThemePreviewProps } from './props'

export const themePreviewDefinition = {
  kind: 'selfClosing',
  name: 'ThemePreview',
  parseProps: parseThemePreviewProps,
  render: ({ props }) => <ThemePreview theme={props.theme} />,
} satisfies MdxComponentDefinition<'ThemePreview'>
