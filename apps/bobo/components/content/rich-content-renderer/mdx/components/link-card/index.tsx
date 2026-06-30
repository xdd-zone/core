interface LinkCardProps {
  description?: string
  href: string
  title: string
}

export function LinkCard({ description, href, title }: LinkCardProps) {
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
