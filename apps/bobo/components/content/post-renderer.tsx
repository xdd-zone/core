/* eslint-disable next/no-img-element */
import type { ComponentProps, ReactNode } from 'react'

import Markdown from 'markdown-to-jsx'
import Link from 'next/link'

import { cn } from '@/lib/utils'

interface PostRendererProps {
  source: string
}

type PostSegment =
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

type AllowedMdxComponent = 'Callout' | 'Figure' | 'LinkCard' | 'ThemePreview'

const mdxBlockPattern =
  /<(Callout)\b([^>]*)>([\s\S]*?)<\/\1>|<(Figure|LinkCard|ThemePreview)\b([^>]*)\/>/g

const markdownOverrides = {
  a: {
    component: MarkdownLink,
  },
  blockquote: {
    component: Blockquote,
  },
  code: {
    component: InlineCode,
  },
  h1: {
    component: HeadingOne,
  },
  h2: {
    component: HeadingTwo,
  },
  h3: {
    component: HeadingThree,
  },
  hr: {
    component: Divider,
  },
  img: {
    component: MarkdownImage,
  },
  ol: {
    component: OrderedList,
  },
  p: {
    component: Paragraph,
  },
  pre: {
    component: CodeBlock,
  },
  ul: {
    component: UnorderedList,
  },
}

export function PostRenderer({ source }: PostRendererProps) {
  const segments = parsePostSegments(source)

  return (
    <article className="space-y-5 text-[0.95rem] leading-7 text-fg-subtle md:text-base md:leading-8">
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
    </article>
  )
}

export function parsePostSegments(source: string): PostSegment[] {
  const segments: PostSegment[] = []
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

function appendMarkdownSegment(segments: PostSegment[], content: string) {
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

function MdxSegment({ segment }: { segment: Extract<PostSegment, { kind: 'mdx' }> }) {
  if (segment.component === 'Callout') {
    return <Callout tone={segment.props.tone}>{segment.text}</Callout>
  }

  if (segment.component === 'Figure') {
    return <Figure alt={segment.props.alt} caption={segment.props.caption} src={segment.props.src} />
  }

  if (segment.component === 'LinkCard') {
    return (
      <LinkCard description={segment.props.description} href={segment.props.href} title={segment.props.title} />
    )
  }

  return <ThemePreview theme={segment.props.theme} />
}

function HeadingOne({ children }: { children: ReactNode }) {
  return <h1 className="mt-10 text-3xl font-semibold tracking-tight text-fg md:text-4xl">{children}</h1>
}

function HeadingTwo({ children }: { children: ReactNode }) {
  return <h2 className="mt-10 border-t border-border/70 pt-6 text-2xl font-semibold tracking-tight text-fg">{children}</h2>
}

function HeadingThree({ children }: { children: ReactNode }) {
  return <h3 className="mt-8 text-xl font-semibold tracking-tight text-fg">{children}</h3>
}

function Paragraph({ children }: { children: ReactNode }) {
  return <p>{children}</p>
}

function MarkdownLink({ href = '', children }: ComponentProps<'a'>) {
  if (href.startsWith('/')) {
    return (
      <Link className="font-medium text-primary underline decoration-primary/30 underline-offset-4" href={href}>
        {children}
      </Link>
    )
  }

  return (
    <a
      className="font-medium text-primary underline decoration-primary/30 underline-offset-4"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  )
}

function MarkdownImage({ alt = '', src = '' }: ComponentProps<'img'>) {
  return (
    <span className="my-8 block overflow-hidden rounded-lg border border-border/70 bg-surface/70">
      <img alt={alt} className="h-auto w-full" loading="lazy" src={src} />
    </span>
  )
}

function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="my-6 overflow-x-auto rounded-lg border border-border/80 bg-muted/70 p-4 text-sm leading-6 text-fg">
      {children}
    </pre>
  )
}

function InlineCode({ children, className }: ComponentProps<'code'>) {
  return (
    <code
      className={cn(
        'rounded-sm border border-border/70 bg-muted/70 px-1.5 py-0.5 text-[0.9em] font-medium text-fg',
        className,
      )}
    >
      {children}
    </code>
  )
}

function Blockquote({ children }: { children: ReactNode }) {
  return <blockquote className="border-l-2 border-primary/60 pl-4 text-fg-muted">{children}</blockquote>
}

function UnorderedList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 marker:text-primary/80">{children}</ul>
}

function OrderedList({ children }: { children: ReactNode }) {
  return <ol className="list-decimal space-y-2 pl-5 marker:text-primary/80">{children}</ol>
}

function Divider() {
  return <hr className="my-10 border-border/70" />
}

function Callout({ children, tone = 'info' }: { children: ReactNode; tone?: string }) {
  const toneClassName = {
    danger: 'border-destructive/40 bg-destructive/10 text-destructive',
    info: 'border-primary/35 bg-primary/10 text-fg',
    success: 'border-accent/45 bg-accent/20 text-fg',
    warning: 'border-secondary/50 bg-secondary/30 text-fg',
  }[tone]

  return <aside className={cn('rounded-lg border px-4 py-3 text-sm leading-6', toneClassName)}>{children}</aside>
}

function Figure({ alt = '', caption, src = '' }: { alt?: string; caption?: string; src?: string }) {
  return (
    <figure className="my-8 overflow-hidden rounded-lg border border-border/70 bg-surface/80">
      <img alt={alt} className="h-auto w-full" loading="lazy" src={src} />
      {caption ? <figcaption className="border-t border-border/70 px-4 py-3 text-sm text-fg-muted">{caption}</figcaption> : null}
    </figure>
  )
}

function LinkCard({ description, href = '', title = href }: { description?: string; href?: string; title?: string }) {
  return (
    <a
      className="my-6 block rounded-lg border border-border/80 bg-surface/75 p-4 transition hover:border-primary/40 hover:bg-accent/20"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <span className="block text-base font-semibold text-fg">{title}</span>
      {description ? <span className="mt-1 block text-sm leading-6 text-fg-muted">{description}</span> : null}
      <span className="mt-3 block truncate text-xs text-primary">{href}</span>
    </a>
  )
}

function ThemePreview({ theme = 'latte' }: { theme?: string }) {
  const swatches = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-muted']

  return (
    <section className="my-6 rounded-lg border border-border/80 bg-surface/80 p-4" data-theme={theme}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-fg">主题预览</p>
          <p className="mt-1 text-xs text-fg-muted">{theme}</p>
        </div>
        <div className="flex gap-2">
          {swatches.map((className) => (
            <span key={className} className={cn('size-6 rounded-sm border border-border/70', className)} />
          ))}
        </div>
      </div>
    </section>
  )
}
