import Markdown from 'markdown-to-jsx'

import { markdownOverrides } from './markdown-overrides'
import { MdxSegment } from './mdx/render-mdx-segment'
import { parseContentSegments } from './parser'

interface RichContentRendererProps {
  source: string
}

export function RichContentRenderer({ source }: RichContentRendererProps) {
  const segments = parseContentSegments(source)

  return (
    <div className="space-y-5 text-[0.95rem] leading-7 text-fg-subtle md:text-base md:leading-8">
      {segments.map((segment, index) => {
        if (segment.kind === 'markdown') {
          return (
            <Markdown
              key={`markdown-${index}`}
              options={{
                disableParsingRawHTML: true,
                forceBlock: true,
                overrides: markdownOverrides,
              }}
            >
              {segment.content}
            </Markdown>
          )
        }

        return <MdxSegment key={`mdx-${index}`} segment={segment} />
      })}
    </div>
  )
}
