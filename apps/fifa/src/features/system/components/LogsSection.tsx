import type { SystemLogEntry, SystemLogLevel, SystemLogListQuery, SystemReadinessCheck } from '@xdd-zone/contracts'
import type { TableProps } from 'antd'
import { useSystemLogsInfiniteQuery } from '@fifa/api/system'
import { Alert, App, Button, Descriptions, Drawer, Input, Segmented, Select, Skeleton, Space, Table, Tag } from 'antd'
import { Copy, Eye, ListFilter, RotateCcw, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type LogQuery = Omit<SystemLogListQuery, 'cursor'>
type LogScope = 'all' | 'anomalies' | 'errors' | 'serverErrors' | 'slowRequests'

interface LogTextFilters {
  event: string
  module: string
  path: string
  requestId: string
}

const emptyFilters: LogTextFilters = {
  event: '',
  module: '',
  path: '',
  requestId: '',
}

const levelColor: Record<SystemLogLevel, string> = {
  debug: 'default',
  error: 'error',
  fatal: 'error',
  info: 'processing',
  trace: 'default',
  warn: 'warning',
}

export function LogsSection({ availability }: { availability?: SystemReadinessCheck }) {
  const { t } = useTranslation()

  if (!availability) {
    return <Skeleton active paragraph={{ rows: 5 }} title={false} />
  }

  if (availability.status === 'disabled') {
    return (
      <Alert
        description={t('systemOperations.logs.disabledDescription')}
        title={t('systemOperations.logs.disabledTitle')}
        showIcon
        type="info"
      />
    )
  }

  if (availability.status === 'error') {
    return (
      <Alert
        description={t('systemOperations.logs.unavailableDescription')}
        title={t('systemOperations.logs.unavailableTitle')}
        showIcon
        type="error"
      />
    )
  }

  return <EnabledLogsSection />
}

function EnabledLogsSection() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const [rangeMinutes, setRangeMinutes] = useState(60)
  const [scope, setScope] = useState<LogScope>('anomalies')
  const [draftFilters, setDraftFilters] = useState<LogTextFilters>(emptyFilters)
  const [filters, setFilters] = useState<LogTextFilters>(emptyFilters)
  const [selectedLog, setSelectedLog] = useState<SystemLogEntry | null>(null)

  const query = useMemo(() => createLogQuery(rangeMinutes, scope, filters), [filters, rangeMinutes, scope])
  const logsQuery = useSystemLogsInfiniteQuery(query, true)

  const pages = logsQuery.data?.pages
  const failure = pages?.find((page) => !page.ok)
  const logs = useMemo(() => {
    const entries = new Map<string, SystemLogEntry>()

    for (const page of pages ?? []) {
      if (!page.ok) continue
      for (const log of page.data.logs) entries.set(log.id, log)
    }

    return [...entries.values()]
  }, [pages])
  const latestPage = [...(pages ?? [])].reverse().find((page) => page.ok)

  const dateTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' }),
    [],
  )
  const formatDateTime = useCallback((value: string) => dateTimeFormatter.format(new Date(value)), [dateTimeFormatter])

  const handleApplyFilters = useCallback(() => {
    setFilters(normalizeFilters(draftFilters))
  }, [draftFilters])

  const handleReset = useCallback(() => {
    setDraftFilters(emptyFilters)
    setFilters(emptyFilters)
    setRangeMinutes(60)
    setScope('anomalies')
  }, [])

  const handleFilterRequestId = useCallback((requestId: string) => {
    const next = { ...emptyFilters, requestId }
    setDraftFilters(next)
    setFilters(next)
    setSelectedLog(null)
  }, [])

  const handleCopyRequestId = useCallback(
    async (requestId: string) => {
      try {
        await navigator.clipboard.writeText(requestId)
        message.success(t('systemOperations.logs.requestIdCopied'))
      } catch {
        message.error(t('systemOperations.logs.copyFailed'))
      }
    },
    [message, t],
  )

  const columns = useMemo<TableProps<SystemLogEntry>['columns']>(
    () => [
      {
        dataIndex: 'timestamp',
        title: t('systemOperations.logs.table.timestamp'),
        width: 190,
        render: (value: string) => <span className="tabular-nums text-sm">{formatDateTime(value)}</span>,
      },
      {
        dataIndex: 'level',
        title: t('systemOperations.logs.table.level'),
        width: 90,
        render: (level: SystemLogLevel) => <Tag color={levelColor[level]}>{level.toUpperCase()}</Tag>,
      },
      {
        key: 'source',
        title: t('systemOperations.logs.table.source'),
        width: 220,
        render: (_, record) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-fg">{record.module ?? '-'}</div>
            <div className="mt-1 truncate font-mono text-xs text-fg-muted">{record.event ?? '-'}</div>
          </div>
        ),
      },
      {
        dataIndex: 'message',
        title: t('systemOperations.logs.table.message'),
        render: (value: string, record) => (
          <div className="min-w-0">
            <div className="truncate text-fg">{value}</div>
            {record.path ? (
              <div className="mt-1 truncate font-mono text-xs text-fg-muted">
                {record.method ? `${record.method} ` : ''}
                {record.path}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        key: 'result',
        title: t('systemOperations.logs.table.result'),
        width: 130,
        render: (_, record) => (
          <div className="space-y-1 text-xs tabular-nums">
            <div className={record.status && record.status >= 500 ? 'text-danger' : 'text-fg'}>
              {record.status ?? '-'}
            </div>
            <div className="text-fg-muted">{record.durationMs === null ? '-' : `${record.durationMs} ms`}</div>
          </div>
        ),
      },
      {
        dataIndex: 'requestId',
        title: 'Request ID',
        width: 170,
        render: (value: string | null) => (
          <span className="block truncate font-mono text-xs text-fg-muted">{value ?? '-'}</span>
        ),
      },
      {
        key: 'actions',
        title: t('systemOperations.logs.table.actions'),
        width: 70,
        render: (_, record) => (
          <Button
            aria-label={t('systemOperations.logs.viewDetail')}
            icon={<Eye className="size-4" />}
            onClick={(event) => {
              event.stopPropagation()
              setSelectedLog(record)
            }}
            type="text"
          />
        ),
      },
    ],
    [formatDateTime, t],
  )

  const scopeOptions = useMemo(
    () => [
      { label: t('systemOperations.logs.scope.all'), value: 'all' },
      { label: t('systemOperations.logs.scope.anomalies'), value: 'anomalies' },
      { label: t('systemOperations.logs.scope.errors'), value: 'errors' },
      { label: t('systemOperations.logs.scope.serverErrors'), value: 'serverErrors' },
      { label: t('systemOperations.logs.scope.slowRequests'), value: 'slowRequests' },
    ],
    [t],
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented onChange={(value) => setScope(value as LogScope)} options={scopeOptions} value={scope} />
        <Select
          className="w-32"
          onChange={setRangeMinutes}
          options={[
            { label: t('systemOperations.logs.range.15'), value: 15 },
            { label: t('systemOperations.logs.range.60'), value: 60 },
            { label: t('systemOperations.logs.range.360'), value: 360 },
            { label: t('systemOperations.logs.range.1440'), value: 1440 },
          ]}
          value={rangeMinutes}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto]">
        <Input
          allowClear
          onChange={(event) => setDraftFilters((current) => ({ ...current, module: event.target.value }))}
          onPressEnter={handleApplyFilters}
          placeholder={t('systemOperations.logs.filter.module')}
          value={draftFilters.module}
        />
        <Input
          allowClear
          onChange={(event) => setDraftFilters((current) => ({ ...current, event: event.target.value }))}
          onPressEnter={handleApplyFilters}
          placeholder={t('systemOperations.logs.filter.event')}
          value={draftFilters.event}
        />
        <Input
          allowClear
          onChange={(event) => setDraftFilters((current) => ({ ...current, path: event.target.value }))}
          onPressEnter={handleApplyFilters}
          placeholder={t('systemOperations.logs.filter.path')}
          value={draftFilters.path}
        />
        <Input
          allowClear
          onChange={(event) => setDraftFilters((current) => ({ ...current, requestId: event.target.value }))}
          onPressEnter={handleApplyFilters}
          placeholder="Request ID"
          value={draftFilters.requestId}
        />
        <Button icon={<Search className="size-4" />} onClick={handleApplyFilters} type="primary">
          {t('systemOperations.logs.search')}
        </Button>
        <Button icon={<RotateCcw className="size-4" />} onClick={handleReset}>
          {t('systemOperations.logs.reset')}
        </Button>
      </div>

      {failure && !failure.ok ? <Alert showIcon title={failure.error.message} type="error" /> : null}

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <Table<SystemLogEntry>
          columns={columns}
          dataSource={logs}
          loading={logsQuery.isLoading}
          locale={{ emptyText: t('systemOperations.logs.empty') }}
          onRow={(record) => ({
            onClick: () => setSelectedLog(record),
          })}
          pagination={false}
          rowClassName="cursor-pointer"
          rowKey="id"
          scroll={{ x: 1180 }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-fg-muted">
        <span>
          {latestPage && latestPage.ok
            ? t('systemOperations.logs.rangeSummary', {
                count: logs.length,
                from: formatDateTime(latestPage.data.from),
                to: formatDateTime(latestPage.data.to),
              })
            : null}
        </span>
        {logsQuery.hasNextPage ? (
          <Button loading={logsQuery.isFetchingNextPage} onClick={() => void logsQuery.fetchNextPage()}>
            {t('systemOperations.logs.loadMore')}
          </Button>
        ) : null}
      </div>

      <Drawer
        onClose={() => setSelectedLog(null)}
        open={!!selectedLog}
        size="large"
        title={t('systemOperations.logs.detailTitle')}
      >
        {selectedLog ? (
          <div className="space-y-5">
            {selectedLog.requestId ? (
              <Space wrap>
                <Button
                  icon={<ListFilter className="size-4" />}
                  onClick={() => handleFilterRequestId(selectedLog.requestId!)}
                >
                  {t('systemOperations.logs.filterSameRequest')}
                </Button>
                <Button
                  icon={<Copy className="size-4" />}
                  onClick={() => void handleCopyRequestId(selectedLog.requestId!)}
                >
                  {t('systemOperations.logs.copyRequestId')}
                </Button>
              </Space>
            ) : null}

            <Descriptions
              column={1}
              items={[
                {
                  key: 'timestamp',
                  label: t('systemOperations.logs.table.timestamp'),
                  children: formatDateTime(selectedLog.timestamp),
                },
                {
                  key: 'level',
                  label: t('systemOperations.logs.table.level'),
                  children: <Tag color={levelColor[selectedLog.level]}>{selectedLog.level.toUpperCase()}</Tag>,
                },
                { key: 'module', label: 'Module', children: selectedLog.module ?? '-' },
                { key: 'event', label: 'Event', children: selectedLog.event ?? '-' },
                { key: 'message', label: t('systemOperations.logs.table.message'), children: selectedLog.message },
                { key: 'requestId', label: 'Request ID', children: selectedLog.requestId ?? '-' },
                { key: 'method', label: 'Method', children: selectedLog.method ?? '-' },
                { key: 'path', label: 'Path', children: selectedLog.path ?? '-' },
                { key: 'status', label: 'Status', children: selectedLog.status ?? '-' },
                {
                  key: 'durationMs',
                  label: t('systemOperations.logs.duration'),
                  children: selectedLog.durationMs === null ? '-' : `${selectedLog.durationMs} ms`,
                },
                { key: 'release', label: 'Release', children: selectedLog.release ?? '-' },
                { key: 'instance', label: 'Instance', children: selectedLog.instance ?? '-' },
                { key: 'errorName', label: 'Error Name', children: selectedLog.errorName ?? '-' },
                { key: 'errorCode', label: 'Error Code', children: selectedLog.errorCode ?? '-' },
                { key: 'errorMessage', label: 'Error Message', children: selectedLog.errorMessage ?? '-' },
              ]}
              size="small"
            />

            <section>
              <h3 className="mb-2 text-sm font-medium text-fg">Context</h3>
              <pre className="max-h-96 overflow-auto rounded-md bg-surface-subtle p-3 text-xs text-fg">
                {JSON.stringify(selectedLog.context, null, 2)}
              </pre>
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}

function createLogQuery(rangeMinutes: number, scope: LogScope, filters: LogTextFilters): LogQuery {
  const base: LogQuery = {
    event: filters.event || undefined,
    limit: 100,
    minLevel: 'warn',
    module: filters.module || undefined,
    path: filters.path || undefined,
    rangeMinutes,
    requestId: filters.requestId || undefined,
  }

  switch (scope) {
    case 'all':
      return { ...base, minLevel: 'info' }
    case 'errors':
      return { ...base, minLevel: 'error' }
    case 'serverErrors':
      return { ...base, minLevel: 'info', statusFrom: 500, statusTo: 599 }
    case 'slowRequests':
      return { ...base, minDurationMs: 1000, minLevel: 'info' }
    case 'anomalies':
      return base
  }
}

function normalizeFilters(filters: LogTextFilters): LogTextFilters {
  return {
    event: filters.event.trim(),
    module: filters.module.trim(),
    path: filters.path.trim(),
    requestId: filters.requestId.trim(),
  }
}
