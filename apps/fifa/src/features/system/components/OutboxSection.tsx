import type { EventOutboxListItem, EventOutboxListQuery, EventOutboxStatus } from '@xdd-zone/contracts'
import type { TableProps } from 'antd'
import { useEventOutboxQuery, useEventsOutboxQuery, useRetryEventOutboxMutation } from '@fifa/api/events'
import { Alert, App, Button, Descriptions, Drawer, Input, Select, Space, Table, Tag } from 'antd'
import { Eye, RotateCcw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type OutboxTablePagination = Parameters<NonNullable<TableProps<EventOutboxListItem>['onChange']>>[0]

const statusColor: Record<EventOutboxStatus, string> = {
  done: 'success',
  failed: 'error',
  pending: 'warning',
  processing: 'processing',
}

export function OutboxSection({ onRetried }: { onRetried: () => Promise<unknown> }) {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const [query, setQuery] = useState<EventOutboxListQuery>({ page: 1, pageSize: 20 })
  const [selectedEventId, setSelectedEventId] = useState('')
  const outboxQuery = useEventsOutboxQuery(query)
  const detailQuery = useEventOutboxQuery(selectedEventId)
  const retryMutation = useRetryEventOutboxMutation()

  const outbox = outboxQuery.data?.ok ? outboxQuery.data.data : undefined
  const detail = detailQuery.data?.ok ? detailQuery.data.data.event : undefined
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

      await onRetried()
    },
    [message, onRetried, retryMutation, t],
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

  return (
    <div className="space-y-3">
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

      {outboxError ? <Alert showIcon title={outboxError} type="error" /> : null}

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

      <Drawer
        loading={detailQuery.isLoading}
        onClose={() => setSelectedEventId('')}
        open={!!selectedEventId}
        size="large"
        title={t('systemOperations.outbox.detailTitle')}
      >
        {detailError ? <Alert showIcon title={detailError} type="error" /> : null}
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
