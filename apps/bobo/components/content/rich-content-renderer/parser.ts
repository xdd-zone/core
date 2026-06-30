import type { AllowedMdxComponent } from './mdx/registry'

import { pairedMdxComponentNames, selfClosingMdxComponentNames } from './mdx/registry'

export type { AllowedMdxComponent } from './mdx/registry'

export type ContentSegment =
  | {
      content: string
      kind: 'markdown'
    }
  | {
      component: AllowedMdxComponent
      kind: 'mdx'
      props: Record<string, string>
      text: string
    }

export type MdxContentSegment = Extract<ContentSegment, { kind: 'mdx' }>

const pairedComponentPattern = pairedMdxComponentNames.join('|')
const selfClosingComponentPattern = selfClosingMdxComponentNames.join('|')
const mdxBlockPattern = new RegExp(
  `<(${pairedComponentPattern})\\b([^>]*)>([\\s\\S]*?)<\\/\\1>|<(${selfClosingComponentPattern})\\b([^>]*)\\/>`,
  'g',
)

export function parseContentSegments(source: string): ContentSegment[] {
  const segments: ContentSegment[] = []
  let lastIndex = 0

  for (const match of source.matchAll(mdxBlockPattern)) {
    const index = match.index ?? 0
    appendMarkdownSegment(segments, source.slice(lastIndex, index))

    const calloutName = match[1] as AllowedMdxComponent | undefined
    const selfClosingName = match[4] as AllowedMdxComponent | undefined
    const component = calloutName ?? selfClosingName
    const rawProps = calloutName ? match[2] : match[5]
    const text = match[3] ?? ''

    if (!component) {
      continue
    }

    segments.push({
      component,
      kind: 'mdx',
      props: parseProps(rawProps ?? ''),
      text,
    })

    lastIndex = index + match[0].length
  }

  appendMarkdownSegment(segments, source.slice(lastIndex))
  return segments
}

function appendMarkdownSegment(segments: ContentSegment[], content: string) {
  if (!content.trim()) {
    return
  }

  segments.push({
    content,
    kind: 'markdown',
  })
}

function parseProps(rawProps: string) {
  const props: Record<string, string> = {}
  const propPattern = /\s([a-z][a-z0-9]*)=(?:"([^"]*)"|'([^']*)')/gi

  for (const match of rawProps.matchAll(propPattern)) {
    props[match[1]] = match[2] ?? match[3] ?? ''
  }

  return props
}
