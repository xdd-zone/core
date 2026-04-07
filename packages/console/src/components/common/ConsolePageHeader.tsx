import type { ReactNode } from 'react'

import { Button } from 'antd'
import { ArrowLeft } from 'lucide-react'

interface ConsolePageHeaderSummaryItem {
  label: string
  value: ReactNode
}

interface ConsolePageHeaderProps {
  actions?: ReactNode
  backLabel?: string
  description?: string
  onBack?: () => void
  summaryItems?: ConsolePageHeaderSummaryItem[]
  title: ReactNode
}

/**
 * 后台页面头部。
 * 用于统一标题、返回、摘要标签和右侧操作区的排版。
 */
export function ConsolePageHeader({
  actions,
  backLabel,
  description,
  onBack,
  summaryItems = [],
  title,
}: ConsolePageHeaderProps) {
  const hasSummary = summaryItems.length > 0
  const hasAside = hasSummary || Boolean(actions)

  return (
    <section className="rounded-[28px] border border-border-subtle bg-surface/85 px-5 py-5 shadow-sm backdrop-blur-xs sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 max-w-3xl">
          {onBack ? (
            <Button type="text" className="-ml-3 px-3" icon={<ArrowLeft className="size-4" />} onClick={onBack}>
              {backLabel}
            </Button>
          ) : null}
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-fg sm:text-2xl">{title}</h1>
          {description ? <p className="text-fg-muted mt-2 max-w-2xl text-sm">{description}</p> : null}
        </div>

        {hasAside ? (
          <div className="flex flex-col items-start gap-3 xl:max-w-[44%] xl:items-end">
            {hasSummary ? (
              <div className="flex flex-wrap gap-2 xl:justify-end">
                {summaryItems.map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-overlay-0/16 px-2.5 py-1 text-xs"
                  >
                    <span className="text-fg-muted">{item.label}</span>
                    <span className="font-medium text-fg">{item.value}</span>
                  </span>
                ))}
              </div>
            ) : null}

            {actions ? <div className="flex flex-wrap gap-2 xl:justify-end">{actions}</div> : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
