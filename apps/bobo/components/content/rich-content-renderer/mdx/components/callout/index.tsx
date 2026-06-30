import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface CalloutProps {
  children: ReactNode
  tone: string
}

export function Callout({ children, tone }: CalloutProps) {
  const toneClassName = {
    danger: 'border-destructive/40 bg-destructive/10 text-destructive',
    info: 'border-primary/35 bg-primary/10 text-fg',
    success: 'border-accent/45 bg-accent/20 text-fg',
    warning: 'border-secondary/50 bg-secondary/30 text-fg',
  }[tone]

  return <aside className={cn('rounded-lg border px-4 py-3 text-sm leading-6', toneClassName)}>{children}</aside>
}
