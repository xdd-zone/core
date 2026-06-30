import type { MdxComponentDefinition } from '../../types'

import { Figure } from '.'
import { parseFigureProps } from './props'

export const figureDefinition = {
  kind: 'selfClosing',
  name: 'Figure',
  parseProps: parseFigureProps,
  render: ({ props }) => <Figure alt={props.alt} caption={props.caption} src={props.src} />,
} satisfies MdxComponentDefinition<'Figure'>
