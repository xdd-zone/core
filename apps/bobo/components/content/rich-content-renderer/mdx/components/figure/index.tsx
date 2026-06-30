/* eslint-disable next/no-img-element */
interface FigureProps {
  alt: string
  caption?: string
  src: string
}

export function Figure({ alt, caption, src }: FigureProps) {
  return (
    <figure className="my-8 overflow-hidden rounded-lg border border-border/70 bg-surface/80">
      <img alt={alt} className="h-auto w-full" loading="lazy" src={src} />
      {caption ? (
        <figcaption className="border-t border-border/70 px-4 py-3 text-sm text-fg-muted">{caption}</figcaption>
      ) : null}
    </figure>
  )
}
