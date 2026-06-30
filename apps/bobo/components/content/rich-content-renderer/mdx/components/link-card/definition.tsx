import type { MdxComponentDefinition } from '../../types'

import { LinkCard } from '.'
import { parseLinkCardProps } from './props'

export const linkCardDefinition = {
  kind: 'selfClosing',
  name: 'LinkCard',
  parseProps: parseLinkCardProps,
  render: ({ props }) => <LinkCard description={props.description} href={props.href} title={props.title} />,
} satisfies MdxComponentDefinition<'LinkCard'>
