import { eventsQueryKeys } from '@fifa/api/events'
import { systemQueryKeys, useSystemReadinessQuery } from '@fifa/api/system'
import { FifaPageHeader } from '@fifa/components/common'
import { LogsSection } from '@fifa/features/system/components/LogsSection'
import { OutboxSection } from '@fifa/features/system/components/OutboxSection'
import { ReadinessSection } from '@fifa/features/system/components/ReadinessSection'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { Button, Tabs } from 'antd'
import { RefreshCw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type OperationsTab = 'logs' | 'outbox' | 'readiness'

export function SystemOperations() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<OperationsTab>('readiness')
  const readinessQuery = useSystemReadinessQuery()
  const outboxFetching = useIsFetching({ queryKey: eventsQueryKeys.outbox() })
  const logsFetching = useIsFetching({ queryKey: systemQueryKeys.logs() })

  const readiness = readinessQuery.data?.ok ? readinessQuery.data.data : undefined
  const readinessError = readinessQuery.data && !readinessQuery.data.ok ? readinessQuery.data.error.message : undefined
  const loggingAvailability = readiness?.checks.find((check) => check.name === 'logging')

  const dateTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' }),
    [],
  )
  const formatDateTime = useCallback(
    (value: string | null | undefined) => (value ? dateTimeFormatter.format(new Date(value)) : '-'),
    [dateTimeFormatter],
  )

  const handleRefresh = useCallback(async () => {
    if (activeTab === 'readiness') {
      await readinessQuery.refetch()
      return
    }

    if (activeTab === 'outbox') {
      await queryClient.invalidateQueries({ queryKey: eventsQueryKeys.outbox() })
      return
    }

    await Promise.all([readinessQuery.refetch(), queryClient.invalidateQueries({ queryKey: systemQueryKeys.logs() })])
  }, [activeTab, queryClient, readinessQuery])

  const refreshing =
    activeTab === 'readiness'
      ? readinessQuery.isFetching
      : activeTab === 'outbox'
        ? outboxFetching > 0
        : logsFetching > 0

  const tabs = useMemo(
    () => [
      { key: 'readiness', label: t('systemOperations.tabs.readiness') },
      { key: 'outbox', label: t('systemOperations.tabs.outbox') },
      { key: 'logs', label: t('systemOperations.tabs.logs') },
    ],
    [t],
  )

  return (
    <div className="space-y-5">
      <FifaPageHeader
        actions={
          <Button icon={<RefreshCw className="size-4" />} loading={refreshing} onClick={() => void handleRefresh()}>
            {t('common.refresh')}
          </Button>
        }
        description={t('systemOperations.description')}
        summaryItems={[
          {
            label: t('systemOperations.summary.status'),
            value: readiness ? t(`systemOperations.overall.${readiness.status}`) : '-',
          },
          {
            label: t('systemOperations.summary.checkedAt'),
            value: formatDateTime(readiness?.checkedAt),
          },
        ]}
        title={t('systemOperations.title')}
      />

      <Tabs activeKey={activeTab} items={tabs} onChange={(key) => setActiveTab(key as OperationsTab)} />

      {activeTab === 'readiness' ? (
        <ReadinessSection error={readinessError} loading={readinessQuery.isLoading} readiness={readiness} />
      ) : null}
      {activeTab === 'outbox' ? <OutboxSection onRetried={() => readinessQuery.refetch()} /> : null}
      {activeTab === 'logs' ? <LogsSection availability={loggingAvailability} /> : null}
    </div>
  )
}
