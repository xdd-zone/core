import type { ThemePreviewProps } from './props'

import { ThemePreviewHeader, ThemePreviewSwatches } from './parts'

export function ThemePreview({ theme }: ThemePreviewProps) {
  return (
    <section className="my-6 rounded-lg border border-border/80 bg-surface/80 p-4" data-theme={theme}>
      <div className="flex items-center justify-between gap-4">
        <ThemePreviewHeader theme={theme} />
        <ThemePreviewSwatches />
      </div>
    </section>
  )
}
