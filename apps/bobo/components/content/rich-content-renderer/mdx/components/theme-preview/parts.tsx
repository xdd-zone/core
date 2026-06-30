import { cn } from '@/lib/utils'

const SWATCHES = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-muted']

export function ThemePreviewHeader({ theme }: { theme: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-fg">主题预览</p>
      <p className="mt-1 text-xs text-fg-muted">{theme}</p>
    </div>
  )
}

export function ThemePreviewSwatches() {
  return (
    <div className="flex gap-2">
      {SWATCHES.map((className) => (
        <span key={className} className={cn('size-6 rounded-sm border border-border/70', className)} />
      ))}
    </div>
  )
}
