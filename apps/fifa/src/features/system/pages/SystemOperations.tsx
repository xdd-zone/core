import type {
  EventOutboxListItem,
  EventOutboxListQuery,
  EventOutboxStatus,
  SystemReadinessCheck,
  SystemReadinessCheckStatus,
} from '@xdd-zone/contracts'
import type { TableProps } from 'antd'
import { useEventOutboxQuery, useEventsOutboxQuery, useRetryEventOutboxMutation } from '@fifa/api/events'
import { useSystemReadinessQuery } from '@fifa/api/system'
import { FifaPageHeader } from '@fifa/components/common'
import { Alert, App, Button, Descriptions, Drawer, Input, Select, Space, Table, Tag } from 'antd'
import { Eye, RefreshCw, RotateCcw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type OutboxTablePagination = Parameters<NonNullable<TableProps<EventOutboxListItem>['onChange']>>[0]

const statusColor: Record<EventOutboxStatus, string> = {
  done: 'success',
  failed: 'error',
  pending: 'warning',
  processing: 'processing',
}

const readinessColor: Record<SystemReadinessCheckStatus, string> = {
  disabled: 'default',
  error: 'error',
  ready: 'success',
}

export function SystemOperations() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const [query, setQuery] = useState<EventOutboxListQuery>({ page: 1, pageSize: 20 })
  const [selectedEventId, setSelectedEventId] = useState('')
  const readinessQuery = useSystemReadinessQuery()
  const outboxQuery = useEventsOutboxQuery(query)
  const detailQuery = useEventOutboxQuery(selectedEventId)
  const retryMutation = useRetryEventOutboxMutation()

  const readiness = readinessQuery.data?.ok ? readinessQuery.data.data : undefined
  const outbox = outboxQuery.data?.ok ? outboxQuery.data.data : undefined
  const detail = detailQuery.data?.ok ? detailQuery.data.data.event : undefined
  const readinessError = readinessQuery.data && !readinessQuery.data.ok ? readinessQuery.data.error.message : undefined
  const outboxError = outboxQuery.data && !outboxQuery.data.ok ? outboxQuery.data.error.message : undefined
  const detailError = detailQuery.data && !detailQuery.data.ok ? detailQuery.data.error.message : undefined

  const dateTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' }),
    [],
  )

  const formatDateTime = useCallback(
    (value: string | null | undefined) => (value ? dateTimeFormatter.format(new Date(value)) : '-'),
    [dateTimeFormatter],
  )

  const handleRetry = useCallback(
    async (eventId: string) => {
      const response = await retryMutation.mutateAsync(eventId)

      if (!response.ok) {
        message.error(response.error.message)
        return
      }

      if (response.data.warnings.length > 0) {
        message.warning(t('systemOperations.outbox.retryWarning'))
      } else {
        message.success(t('systemOperations.outbox.retrySuccess'))
      }

      await readinessQuery.refetch()
    },
    [message, readinessQuery, retryMutation, t],
  )

  const columns = useMemo<TableProps<EventOutboxListItem>['columns']>(
    () => [
      {
        dataIndex: 'eventType',
        title: t('systemOperations.outbox.table.eventType'),
        render: (value: string) => <span className="font-mono text-xs text-fg">{value}</span>,
      },
      {
        dataIndex: 'status',
        title: t('systemOperations.outbox.table.status'),
        width: 110,
        render: (value: EventOutboxStatus) => (
          <Tag color={statusColor[value]}>{t(`systemOperations.outbox.status.${value}`)}</Tag>
        ),
      },
      {
        dataIndex: 'attempts',
        title: t('systemOperations.outbox.table.attempts'),
        width: 90,
        render: (value: number) => <span className="tabular-nums">{value}</span>,
      },
      {
        dataIndex: 'nextRunAt',
        title: t('systemOperations.outbox.table.nextRunAt'),
        width: 180,
        render: (value: string) => formatDateTime(value),
      },
      {
        dataIndex: 'updatedAt',
        title: t('systemOperations.outbox.table.updatedAt'),
        width: 180,
        render: (value: string) => formatDateTime(value),
      },
      {
        key: 'actions',
        title: t('systemOperations.outbox.table.actions'),
        width: 100,
        render: (_, record) => (
          <Space size={0}>
            <Button
              aria-label={t('systemOperations.outbox.viewDetail')}
              icon={<Eye className="size-4" />}
              onClick={() => setSelectedEventId(record.id)}
              type="text"
            />
            {record.status === 'failed' || record.status === 'pending' ? (
              <Button
                aria-label={t('systemOperations.outbox.retry')}
                icon={<RotateCcw className="size-4" />}
                loading={retryMutation.isPending && retryMutation.variables === record.id}
                onClick={() => void handleRetry(record.id)}
                type="text"
              />
            ) : null}
          </Space>
        ),
      },
    ],
    [formatDateTime, handleRetry, retryMutation.isPending, retryMutation.variables, t],
  )

  const handleTableChange = useCallback((pagination: OutboxTablePagination) => {
    setQuery((current) => ({
      ...current,
      page: pagination.current ?? current.page,
      pageSize: pagination.pageSize ?? current.pageSize,
    }))
  }, [])

  const handleRefresh = useCallback(async () => {
    await Promise.all([readinessQuery.refetch(), outboxQuery.refetch()])
  }, [outboxQuery, readinessQuery])

  return (
    <div className="space-y-5">
      <FifaPageHeader
        actions={
          <Button
            icon={<RefreshCw className="size-4" />}
            loading={readinessQuery.isFetching || outboxQuery.isFetching}
            onClick={() => void handleRefresh()}
          >
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

      <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="text-base font-medium text-fg">{t('systemOperations.readiness.title')}</h2>
        </div>
        {readinessError ? (
          <div className="p-4">
            <Alert message={readinessError} showIcon type="error" />
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {readiness?.checks.map((check) => <ReadinessRow check={check} key={check.name} />) ?? (
              <div className="px-4 py-5 text-sm text-fg-muted">{t('systemOperations.readiness.empty')}</div>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-medium text-fg">{t('systemOperations.outbox.title')}</h2>
            <p className="mt-1 text-sm text-fg-muted">{t('systemOperations.outbox.description')}</p>
          </div>
          <Space className="flex-wrap" size="small">
            <Select
              allowClear
              className="w-36"
              onChange={(status: EventOutboxStatus | undefined) =>
                setQuery((current) => ({ ...current, page: 1, status }))
              }
              options={(['pending', 'processing', 'done', 'failed'] as EventOutboxStatus[]).map((status) => ({
                label: t(`systemOperations.outbox.status.${status}`),
                value: status,
              }))}
              placeholder={t('systemOperations.outbox.filterStatus')}
              value={query.status}
            />
            <Input.Search
              allowClear
              className="w-64"
              onSearch={(eventType) =>
                setQuery((current) => ({ ...current, eventType: eventType || undefined, page: 1 }))
              }
              placeholder={t('systemOperations.outbox.filterEventType')}
            />
          </Space>
        </div>

        {outboxError ? <Alert message={outboxError} showIcon type="error" /> : null}

        <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
          <Table<EventOutboxListItem>
            columns={columns}
            dataSource={outbox?.events ?? []}
            loading={outboxQuery.isLoading}
            locale={{ emptyText: t('systemOperations.outbox.empty') }}
            onChange={handleTableChange}
            pagination={{
              current: query.page,
              pageSize: query.pageSize,
              showSizeChanger: false,
              total: outbox?.total ?? 0,
            }}
            rowKey="id"
            scroll={{ x: 980 }}
          />
        </div>
      </section>

      <Drawer
        loading={detailQuery.isLoading}
        onClose={() => setSelectedEventId('')}
        open={!!selectedEventId}
        size="large"
        title={t('systemOperations.outbox.detailTitle')}
      >
        {detailError ? <Alert message={detailError} showIcon type="error" /> : null}
        {detail ? (
          <div className="space-y-5">
            <Descriptions
              column={1}
              items={[
                { key: 'id', label: 'ID', children: detail.id },
                { key: 'eventType', label: t('systemOperations.outbox.table.eventType'), children: detail.eventType },
                {
                  key: 'status',
                  label: t('systemOperations.outbox.table.status'),
                  children: (
                    <Tag color={statusColor[detail.status]}>{t(`systemOperations.outbox.status.${detail.status}`)}</Tag>
                  ),
                },
                { key: 'attempts', label: t('systemOperations.outbox.table.attempts'), children: detail.attempts },
                {
                  key: 'createdAt',
                  label: t('systemOperations.outbox.createdAt'),
                  children: formatDateTime(detail.createdAt),
                },
                {
                  key: 'lastRunAt',
                  label: t('systemOperations.outbox.lastRunAt'),
                  children: formatDateTime(detail.lastRunAt),
                },
                {
                  key: 'nextRunAt',
                  label: t('systemOperations.outbox.table.nextRunAt'),
                  children: formatDateTime(detail.nextRunAt),
                },
                {
                  key: 'error',
                  label: t('systemOperations.outbox.errorMessage'),
                  children: detail.errorMessage ?? '-',
                },
              ]}
              size="small"
            />
            <section>
              <h3 className="mb-2 text-sm font-medium text-fg">Payload</h3>
              <pre className="max-h-96 overflow-auto rounded-md bg-surface-subtle p-3 text-xs text-fg">
                {JSON.stringify(detail.payload, null, 2)}
              </pre>
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
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
