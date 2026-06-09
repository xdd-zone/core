import type { PingRequest } from '@xdd-zone/contracts'
import { momoBaseUrl } from '@fifa/api/client'
import { usePingSystemMutation, useSystemHealthQuery } from '@fifa/api/system'
import { FifaPageHeader } from '@fifa/components/common'
import { Button, Tag } from 'antd'
import { RefreshCw, Send, Settings, SquareActivity } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const pingPayload: PingRequest = {
  name: 'fifa',
}

export function Home() {
  const { t } = useTranslation()
  const healthQuery = useSystemHealthQuery()
  const pingMutation = usePingSystemMutation()

  const healthResult = healthQuery.data
  const pingResult = pingMutation.data
  const requestBody = JSON.stringify(pingPayload, null, 2)
  const responseBody = pingResult ? JSON.stringify(pingResult, null, 2) : t('home.momo.emptyResponse')
  const statusLabel = healthQuery.isLoading
    ? t('home.momo.status.loading')
    : healthResult?.ok
      ? t('home.momo.status.connected')
      : t('home.momo.status.failed')
  const statusColor = healthQuery.isLoading ? 'processing' : healthResult?.ok ? 'success' : 'error'

  const handlePing = () => {
    pingMutation.mutate(pingPayload)
  }

  return (
    <div className="space-y-6">
      <FifaPageHeader
        title={t('home.title')}
        description={t('home.description')}
        summaryItems={[
          {
            label: t('home.summary.framework'),
            value: t('home.summary.frameworkValue'),
          },
          {
            label: t('home.summary.modules'),
            value: t('home.summary.modulesValue'),
          },
        ]}
      />

      <section className="border-border-subtle bg-surface-muted/60 rounded-lg border p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-fg flex items-center gap-2 text-sm font-medium">
              <SquareActivity size={18} />
              {t('home.shell.title')}
            </div>
            <p className="text-fg-muted mt-2 max-w-2xl text-sm leading-6">{t('home.shell.description')}</p>
          </div>
          <Button icon={<Settings size={16} />} href="/" type="primary">
            {t('home.shell.action')}
          </Button>
        </div>
      </section>

      <section className="border-border-subtle bg-surface rounded-lg border">
        <div className="border-border-subtle flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-fg text-sm font-medium">{t('home.momo.title')}</div>
            <p className="text-fg-muted mt-1 text-sm">{t('home.momo.description')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag color={statusColor}>{statusLabel}</Tag>
            <Button
              icon={<RefreshCw size={15} />}
              loading={healthQuery.isFetching}
              onClick={() => void healthQuery.refetch()}
              size="small"
            >
              {t('common.refresh')}
            </Button>
            <Button icon={<Send size={15} />} loading={pingMutation.isPending} onClick={handlePing} size="small">
              {t('common.ping')}
            </Button>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="border-border-subtle bg-surface-muted/50 space-y-3 border-b px-5 py-4 lg:border-r lg:border-b-0">
            <div>
              <div className="text-fg-muted text-xs">{t('home.momo.baseUrl')}</div>
              <div className="text-fg mt-1 break-all text-sm">{momoBaseUrl}</div>
            </div>
            <div>
              <div className="text-fg-muted text-xs">{t('home.momo.method')}</div>
              <div className="text-fg mt-1 text-sm">GET /health</div>
              <div className="text-fg mt-1 text-sm">POST /rpc/system/ping</div>
            </div>
            {healthResult && !healthResult.ok ? (
              <div>
                <div className="text-fg-muted text-xs">{t('home.momo.errorCode')}</div>
                <div className="text-danger mt-1 break-all text-sm">{healthResult.error.code}</div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-border-subtle border-b px-5 py-4 md:border-r md:border-b-0">
              <div className="text-fg text-sm font-medium">{t('home.momo.request')}</div>
              <pre className="text-fg-muted bg-surface-muted/60 border-border-subtle mt-3 max-h-72 overflow-auto rounded-md border p-3 text-xs leading-5">
                {requestBody}
              </pre>
            </div>
            <div className="px-5 py-4">
              <div className="text-fg text-sm font-medium">{t('home.momo.response')}</div>
              <pre className="text-fg-muted bg-surface-muted/60 border-border-subtle mt-3 max-h-72 overflow-auto rounded-md border p-3 text-xs leading-5">
                {responseBody}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
