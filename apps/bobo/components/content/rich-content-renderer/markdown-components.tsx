/* eslint-disable next/no-img-element */
import type { ComponentProps, ReactNode } from 'react'

import Link from 'next/link'

import { cn } from '@/lib/utils'

export function HeadingOne({ children }: { children: ReactNode }) {
  return <h1 className="mt-10 text-3xl font-semibold tracking-tight text-fg md:text-4xl">{children}</h1>
}

export function HeadingTwo({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-10 border-t border-border/70 pt-6 text-2xl font-semibold tracking-tight text-fg">{children}</h2>
  )
}

export function HeadingThree({ children }: { children: ReactNode }) {
  return <h3 className="mt-8 text-xl font-semibold tracking-tight text-fg">{children}</h3>
}

export function Paragraph({ children }: { children: ReactNode }) {
  return <p>{children}</p>
}

export function MarkdownLink({ href = '', children }: ComponentProps<'a'>) {
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

export function MarkdownImage({ alt = '', src = '' }: ComponentProps<'img'>) {
  return (
    <span className="my-8 block overflow-hidden rounded-lg border border-border/70 bg-surface/70">
      <img alt={alt} className="h-auto w-full" loading="lazy" src={src} />
    </span>
  )
}

export function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="my-6 overflow-x-auto rounded-lg border border-border/80 bg-muted/70 p-4 text-sm leading-6 text-fg">
      {children}
    </pre>
  )
}

export function InlineCode({ children, className }: ComponentProps<'code'>) {
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

export function Blockquote({ children }: { children: ReactNode }) {
  return <blockquote className="border-l-2 border-primary/60 pl-4 text-fg-muted">{children}</blockquote>
}

export function UnorderedList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 marker:text-primary/80">{children}</ul>
}

export function OrderedList({ children }: { children: ReactNode }) {
  return <ol className="list-decimal space-y-2 pl-5 marker:text-primary/80">{children}</ol>
}

export function Divider() {
  return <hr className="my-10 border-border/70" />
}

export function HeadingFour({ children }: { children: ReactNode }) {
  return <h4 className="mt-6 text-lg font-semibold tracking-tight text-fg">{children}</h4>
}

export function HeadingFive({ children }: { children: ReactNode }) {
  return <h5 className="mt-4 text-base font-semibold tracking-tight text-fg">{children}</h5>
}

export function HeadingSix({ children }: { children: ReactNode }) {
  return <h6 className="mt-4 text-sm font-semibold tracking-tight text-fg-subtle">{children}</h6>
}

export function ListItem({ children, ...props }: ComponentProps<'li'>) {
  return (
    <li className="leading-7" {...props}>
      {children}
    </li>
  )
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-fg">{children}</strong>
}

export function Emphasis({ children }: { children: ReactNode }) {
  return <em className="italic">{children}</em>
}

export function Strikethrough({ children }: { children: ReactNode }) {
  return <del className="line-through text-fg-muted">{children}</del>
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 w-full overflow-x-auto">
      <table className="w-full border-collapse rounded-lg border border-border/70 text-sm text-left">{children}</table>
    </div>
  )
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-muted/50 text-fg">{children}</thead>
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border/70 bg-surface/30">{children}</tbody>
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="transition-colors hover:bg-muted/30">{children}</tr>
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <th className="whitespace-nowrap border-b border-border/70 px-4 py-3 font-semibold">{children}</th>
}

export function TableData({ children }: { children: ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3 align-middle text-fg-subtle">{children}</td>
}
