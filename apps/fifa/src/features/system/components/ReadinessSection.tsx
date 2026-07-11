import type { SystemReadinessCheck, SystemReadinessCheckStatus, SystemReadinessResponse } from '@xdd-zone/contracts'
import { Alert, Skeleton, Tag } from 'antd'
import { useTranslation } from 'react-i18next'

const readinessColor: Record<SystemReadinessCheckStatus, string> = {
  disabled: 'default',
  error: 'error',
  ready: 'success',
}

interface ReadinessSectionProps {
  error?: string
  loading: boolean
  readiness?: SystemReadinessResponse
}

export function ReadinessSection({ error, loading, readiness }: ReadinessSectionProps) {
  const { t } = useTranslation()

  if (error) {
    return <Alert showIcon title={error} type="error" />
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
      {loading && !readiness ? (
        <div className="p-4">
          <Skeleton active paragraph={{ rows: 4 }} title={false} />
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {readiness?.checks.map((check) => <ReadinessRow check={check} key={check.name} />) ?? (
            <div className="px-4 py-5 text-sm text-fg-muted">{t('systemOperations.readiness.empty')}</div>
          )}
        </div>
      )}
    </section>
  )
}

function ReadinessRow({ check }: { check: SystemReadinessCheck }) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[minmax(120px,0.8fr)_minmax(120px,0.8fr)_100px_100px_minmax(180px,1.4fr)] sm:items-center">
      <span className="font-medium text-fg">{t(`systemOperations.readiness.component.${check.name}`)}</span>
      <span className="font-mono text-xs text-fg-muted">{check.provider}</span>
      <Tag className="w-fit" color={readinessColor[check.status]}>
        {t(`systemOperations.readiness.status.${check.status}`)}
      </Tag>
      <span className="tabular-nums text-fg-muted">{check.durationMs} ms</span>
      <span className={check.status === 'error' ? 'text-danger' : 'text-fg-muted'}>{check.message ?? '-'}</span>
    </div>
  )
}
