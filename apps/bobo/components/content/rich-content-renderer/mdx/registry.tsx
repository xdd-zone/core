import type { MdxComponentDefinition } from './types'

import { calloutDefinition } from './components/callout/definition'
import { figureDefinition } from './components/figure/definition'
import { linkCardDefinition } from './components/link-card/definition'
import { themePreviewDefinition } from './components/theme-preview/definition'

export const mdxDefinitions = [
  calloutDefinition,
  figureDefinition,
  linkCardDefinition,
  themePreviewDefinition,
] as const satisfies readonly MdxComponentDefinition[]

export type AllowedMdxComponent = (typeof mdxDefinitions)[number]['name']

export const mdxComponentNames = mdxDefinitions.map((definition) => definition.name) as AllowedMdxComponent[]

export const pairedMdxComponentNames = mdxDefinitions
  .filter((definition) => definition.kind === 'paired')
  .map((definition) => definition.name)

export const selfClosingMdxComponentNames = mdxDefinitions
  .filter((definition) => definition.kind === 'selfClosing')
  .map((definition) => definition.name)

export const mdxDefinitionByName = Object.fromEntries(
  mdxDefinitions.map((definition) => [definition.name, definition]),
) as Record<AllowedMdxComponent, (typeof mdxDefinitions)[number]>
