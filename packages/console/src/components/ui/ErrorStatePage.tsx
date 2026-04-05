import type { ReactNode } from 'react'

import { Pattern } from './Pattern'

interface ErrorStateDetailItem {
  content: ReactNode
  label: string
}

interface ErrorStatePageProps {
  actions: ReactNode
  description: string
  detailDescription?: string
  detailItems?: ErrorStateDetailItem[]
  embedded?: boolean
  eyebrow: string
  icon: ReactNode
  note?: string
  patternDuration?: number
  title: string
}

/**
 * 通用错误状态页骨架，用于统一 403、404 和运行时异常页面的布局与层级。
 */
export function ErrorStatePage({
  actions,
  description,
  detailDescription = '需要排查时再看下面的错误信息。',
  detailItems = [],
  embedded = false,
  eyebrow,
  icon,
  note,
  patternDuration = 8,
  title,
}: ErrorStatePageProps) {
  const content = (
    <section className="px-1 py-2 md:px-2">
      <div className="mx-auto max-w-3xl">
        <div className="text-fg-muted text-[11px] font-semibold tracking-[0.2em] uppercase">{eyebrow}</div>
        <div className="mt-3 flex items-start gap-3">
          <div className="bg-danger/10 text-danger flex size-12 shrink-0 items-center justify-center rounded-2xl">
            {icon}
          </div>
          <div className="min-w-0">
            <h1 className="text-fg text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-fg-muted mt-2 text-sm leading-7">{description}</p>

            {note ? (
              <div className="mt-4 border-l border-border-subtle/80 pl-4 text-sm leading-6 text-fg-muted">{note}</div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">{actions}</div>

        {detailItems.length > 0 ? (
          <section className="mt-6 rounded-[24px] border border-border-subtle bg-surface-muted/42 p-5 backdrop-blur-xs">
            <div className="text-fg text-sm font-medium">错误详情</div>
            <p className="text-fg-muted mt-2 text-sm leading-6">{detailDescription}</p>
            <div className="mt-4 rounded-2xl border border-border-subtle bg-overlay-0/20 px-4 py-3">
              <div className="space-y-3">
                {detailItems.map((item) => (
                  <div key={item.label}>
                    <div className="text-fg-muted text-xs">{item.label}</div>
                    <div className="text-fg mt-2 text-sm leading-6 break-words">{item.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </section>
  )

  if (embedded) {
    return content
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
      <Pattern animationDuration={patternDuration} />

      <div className="relative z-10 w-full max-w-5xl">{content}</div>
    </div>
  )
}
