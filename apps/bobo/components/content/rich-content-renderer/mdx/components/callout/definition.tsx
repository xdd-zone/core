import type { MdxComponentDefinition } from '../../types'

import { Callout } from '.'
import { parseCalloutProps } from './props'

export const calloutDefinition = {
  kind: 'paired',
  name: 'Callout',
  parseProps: parseCalloutProps,
  render: ({ props, text }) => <Callout tone={props.tone}>{text}</Callout>,
} satisfies MdxComponentDefinition<'Callout'>
