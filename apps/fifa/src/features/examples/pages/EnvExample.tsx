import type { ReactNode } from 'react'
import { fifaEnv, momoBaseUrl } from '@fifa/api/client'
import { useSystemHealthQuery } from '@fifa/api/system'
import { FifaPageHeader } from '@fifa/components/common'
import { Button, Tag } from 'antd'
import { Monitor, RefreshCw, Server } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function EnvExample() {
  const { t } = useTranslation()
  const healthQuery = useSystemHealthQuery()

  const healthResult = healthQuery.data
  const momoEnv = healthResult?.ok ? healthResult.data.env : t('example.env.momo.empty')
  const statusColor = healthQuery.isLoading ? 'processing' : healthResult?.ok ? 'success' : 'error'
  const statusLabel = healthQuery.isLoading
    ? t('example.env.status.loading')
    : healthResult?.ok
      ? t('example.env.status.connected')
      : t('example.env.status.failed')

  const fifaRows = [
    {
      key: 'VITE_APP_ENV',
      scope: t('example.env.scope.browser'),
      value: fifaEnv.VITE_APP_ENV,
    },
    {
      key: 'VITE_MOMO_BASE_URL',
      scope: t('example.env.scope.browser'),
      value: fifaEnv.VITE_MOMO_BASE_URL,
    },
  ]

  const momoRows = [
    {
      key: 'APP_ENV',
      scope: t('example.env.scope.server'),
      value: momoEnv,
    },
    {
      key: 'GET /health',
      scope: t('example.env.scope.request'),
      value: momoBaseUrl,
    },
  ]

  return (
    <div className="space-y-6">
      <FifaPageHeader
        title={t('example.env.title')}
        description={t('example.env.description')}
        summaryItems={[
          {
            label: t('example.env.summary.fifa'),
            value: fifaEnv.VITE_APP_ENV,
          },
          {
            label: t('example.env.summary.momo'),
            value: momoEnv,
          },
        ]}
        actions={
          <Button
            icon={<RefreshCw size={15} />}
            loading={healthQuery.isFetching}
            onClick={() => void healthQuery.refetch()}
            size="small"
          >
            {t('common.refresh')}
          </Button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <EnvPanel
          icon={<Monitor size={18} />}
          rows={fifaRows}
          title={t('example.env.fifa.title')}
          description={t('example.env.fifa.description')}
        />
        <EnvPanel
          icon={<Server size={18} />}
          rows={momoRows}
          title={t('example.env.momo.title')}
          description={t('example.env.momo.description')}
          status={<Tag color={statusColor}>{statusLabel}</Tag>}
        />
      </section>

      <section className="border-border-subtle bg-surface rounded-lg border">
        <div className="border-border-subtle flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-fg text-sm font-medium">{t('example.env.response.title')}</div>
            <p className="text-fg-muted mt-1 text-sm">{t('example.env.response.description')}</p>
          </div>
          <Tag color={statusColor}>{statusLabel}</Tag>
        </div>
        <pre className="text-fg-muted bg-surface-muted/50 m-0 max-h-96 overflow-auto p-5 text-xs leading-5">
          {healthResult ? JSON.stringify(healthResult, null, 2) : t('example.env.response.empty')}
        </pre>
      </section>
    </div>
  )
}

interface EnvPanelProps {
  description: string
  icon: ReactNode
  rows: Array<{
    key: string
    scope: string
    value: ReactNode
  }>
  status?: ReactNode
  title: string
}

function EnvPanel({ description, icon, rows, status, title }: EnvPanelProps) {
  return (
    <section className="border-border-subtle bg-surface rounded-lg border">
      <div className="border-border-subtle flex items-start justify-between gap-3 border-b px-5 py-4">
        <div className="min-w-0">
          <div className="text-fg flex items-center gap-2 text-sm font-medium">
            {icon}
            {title}
          </div>
          <p className="text-fg-muted mt-1 text-sm">{description}</p>
        </div>
        {status}
      </div>

      <div className="divide-border-subtle divide-y">
        {rows.map((row) => (
          <div className="grid gap-2 px-5 py-4 sm:grid-cols-[180px_minmax(0,1fr)]" key={row.key}>
            <div>
              <div className="text-fg text-sm font-medium">{row.key}</div>
              <div className="text-fg-muted mt-1 text-xs">{row.scope}</div>
            </div>
            <div className="text-fg break-all text-sm sm:text-right">{row.value}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
