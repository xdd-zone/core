import type { MdxContentSegment } from '../parser'

import { mdxDefinitionByName } from './registry'

export function MdxSegment({ segment }: { segment: MdxContentSegment }) {
  const definition = mdxDefinitionByName[segment.component]
  const props = definition.parseProps(segment.props)

  return definition.render({
    props,
    text: segment.text,
  })
}
