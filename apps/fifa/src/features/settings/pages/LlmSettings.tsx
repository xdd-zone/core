import type {
  CreateLlmProviderRequest,
  LlmApiFormat,
  LlmCallLog,
  LlmCallLogListQuery,
  LlmCallOperation,
  LlmCallStatus,
  LlmProvider,
  LlmProviderType,
  LlmUseCase,
  LlmUseCaseConfig,
  UpdateLlmProviderRequest,
} from '@xdd-zone/contracts'
import type { TableProps } from 'antd'
import {
  useCreateLlmProviderMutation,
  useDeleteExpiredLlmCallLogsMutation,
  useDeleteLlmProviderApiKeyMutation,
  useLlmCallLogsQuery,
  useLlmProvidersQuery,
  useLlmUseCaseConfigsQuery,
  useTestLlmProviderMutation,
  useUpdateLlmProviderMutation,
  useUpdateLlmUseCaseConfigMutation,
} from '@fifa/api/llm'
import { FifaPageHeader } from '@fifa/components/common'
import {
  App,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from 'antd'
import { Eye, KeyRound, Pencil, RefreshCw, Trash2, Zap } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface DialogState<T> {
  open: boolean
  record: T | null
}

type LlmCallLogTablePagination = Parameters<NonNullable<TableProps<LlmCallLog>['onChange']>>[0]

function ProviderSection() {
  const { t } = useTranslation()
  const { message, modal } = App.useApp()
  const [form] = Form.useForm()
  const [dialog, setDialog] = useState<DialogState<LlmProvider>>({ open: false, record: null })

  const providersQuery = useLlmProvidersQuery()
  const createMutation = useCreateLlmProviderMutation()
  const updateMutation = useUpdateLlmProviderMutation()
  const deleteApiKeyMutation = useDeleteLlmProviderApiKeyMutation()
  const testMutation = useTestLlmProviderMutation()

  const providers = useMemo(
    () => (providersQuery.data?.ok ? providersQuery.data.data.providers : []),
    [providersQuery.data],
  )

  const apiFormatOptions = useMemo(
    () => [
      { label: t('settings.llm.apiFormat.chat_completions'), value: 'chat_completions' },
      { label: t('settings.llm.apiFormat.responses'), value: 'responses' },
    ],
    [t],
  )

  const providerTypeOptions = useMemo(() => [{ label: t('settings.llm.providerType.openai'), value: 'openai' }], [t])

  useEffect(() => {
    if (!dialog.open) return

    form.resetFields()
    if (dialog.record) {
      form.setFieldsValue({
        apiFormat: dialog.record.apiFormat,
        baseUrl: dialog.record.baseUrl,
        defaultModel: dialog.record.defaultModel,
        enabled: dialog.record.enabled,
        name: dialog.record.name,
        providerType: dialog.record.providerType,
        timeoutMs: dialog.record.timeoutMs,
      })
      return
    }

    form.setFieldsValue({
      apiFormat: 'chat_completions',
      enabled: false,
      providerType: 'openai',
      timeoutMs: 15000,
    })
  }, [dialog.open, dialog.record, form])

  const handleOpenCreate = useCallback(() => {
    setDialog({ open: true, record: null })
  }, [])

  const handleOpenEdit = useCallback((record: LlmProvider) => {
    setDialog({ open: true, record })
  }, [])

  const handleSave = useCallback(async () => {
    const values = await form.validateFields()
    const payload = {
      ...values,
      apiKey: values.apiKey?.trim() || undefined,
    }

    if (dialog.record) {
      const res = await updateMutation.mutateAsync({
        payload: payload as UpdateLlmProviderRequest,
        providerId: dialog.record.id,
      })
      if (!res.ok) {
        message.error(res.error.message)
        return
      }
    } else {
      const res = await createMutation.mutateAsync(payload as CreateLlmProviderRequest)
      if (!res.ok) {
        message.error(res.error.message)
        return
      }
    }

    message.success(t(dialog.record ? 'settings.llm.saveSuccess' : 'settings.llm.providers.createSuccess'))
    setDialog({ open: false, record: null })
  }, [createMutation, dialog.record, form, message, t, updateMutation])

  const handleDeleteApiKey = useCallback(
    (record: LlmProvider) => {
      modal.confirm({
        title: t('settings.llm.providers.deleteApiKey'),
        content: t('settings.llm.providers.deleteApiKeyConfirm'),
        okText: t('settings.llm.providers.deleteApiKey'),
        okButtonProps: { danger: true },
        cancelText: t('settings.llm.cancel'),
        onOk: async () => {
          const res = await deleteApiKeyMutation.mutateAsync(record.id)
          if (!res.ok) {
            message.error(res.error.message)
            return
          }
          message.success(t('settings.llm.providers.deleteApiKeySuccess'))
        },
      })
    },
    [deleteApiKeyMutation, message, modal, t],
  )

  const handleTest = useCallback(
    async (record: LlmProvider) => {
      const res = await testMutation.mutateAsync(record.id)
      if (!res.ok) {
        message.error(res.error.message)
        return
      }
      if (res.data.status === 'success') {
        message.success(t('settings.llm.providers.testSuccess'))
      } else {
        message.error(t('settings.llm.providers.testFailed'))
      }
    },
    [message, t, testMutation],
  )

  const columns = useMemo<TableProps<LlmProvider>['columns']>(
    () => [
      {
        dataIndex: 'name',
        title: t('settings.llm.providers.table.name'),
        render: (name: string, record: LlmProvider) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-fg">{name}</div>
            <div className="mt-1 truncate font-mono text-xs text-fg-muted">{record.id}</div>
          </div>
        ),
      },
      {
        dataIndex: 'enabled',
        title: t('settings.llm.providers.table.status'),
        width: 90,
        render: (enabled: boolean) => (
          <Tag color={enabled ? 'success' : 'default'}>
            {enabled ? t('settings.llm.status.enabled') : t('settings.llm.status.disabled')}
          </Tag>
        ),
      },
      {
        dataIndex: 'providerType',
        title: t('settings.llm.providers.table.providerType'),
        width: 120,
        render: (type: LlmProviderType) => <Tag>{t(`settings.llm.providerType.${type}`)}</Tag>,
      },
      {
        dataIndex: 'apiFormat',
        title: t('settings.llm.providers.table.apiFormat'),
        width: 140,
        render: (fmt: LlmApiFormat) => t(`settings.llm.apiFormat.${fmt}`),
      },
      {
        dataIndex: 'defaultModel',
        title: t('settings.llm.providers.table.defaultModel'),
        render: (model: string) => <span className="font-mono text-xs">{model}</span>,
      },
      {
        dataIndex: 'hasApiKey',
        title: t('settings.llm.providers.table.apiKey'),
        width: 100,
        render: (hasApiKey: boolean) => (
          <Tag color={hasApiKey ? 'success' : 'warning'}>
            {hasApiKey ? t('settings.llm.apiKey.configured') : t('settings.llm.apiKey.missing')}
          </Tag>
        ),
      },
      {
        key: 'actions',
        title: t('settings.llm.providers.table.actions'),
        width: 180,
        render: (_, record) => (
          <Space size="small">
            <Tooltip title={t('settings.llm.providers.edit')}>
              <Button
                icon={<Pencil className="size-4" />}
                onClick={() => handleOpenEdit(record)}
                size="small"
                type="text"
              />
            </Tooltip>
            <Tooltip title={t('settings.llm.providers.test')}>
              <Button icon={<Zap className="size-4" />} onClick={() => handleTest(record)} size="small" type="text" />
            </Tooltip>
            <Tooltip title={t('settings.llm.providers.deleteApiKey')}>
              <Button
                danger
                disabled={!record.hasApiKey}
                icon={<KeyRound className="size-4" />}
                onClick={() => handleDeleteApiKey(record)}
                size="small"
                type="text"
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [handleDeleteApiKey, handleOpenEdit, handleTest, t],
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Space>
          <Button
            icon={<RefreshCw className="size-4" />}
            loading={providersQuery.isFetching}
            onClick={() => providersQuery.refetch()}
          >
            {t('settings.llm.refresh')}
          </Button>
          <Button onClick={handleOpenCreate} type="primary">
            {t('settings.llm.providers.create')}
          </Button>
        </Space>
      </div>

      <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <Table<LlmProvider>
          columns={columns}
          dataSource={providers}
          loading={providersQuery.isLoading}
          locale={{ emptyText: t('settings.llm.providers.emptyText') }}
          pagination={false}
          rowKey="id"
          scroll={{ x: 900 }}
        />
      </section>

      <Modal
        cancelText={t('settings.llm.cancel')}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnHidden
        okText={t('settings.llm.save')}
        onCancel={() => setDialog({ open: false, record: null })}
        onOk={handleSave}
        open={dialog.open}
        title={dialog.record ? t('settings.llm.providers.editTitle') : t('settings.llm.providers.create')}
      >
        <Form form={form} layout="vertical">
          <Form.Item label={t('settings.llm.providers.form.enabled')} name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            label={t('settings.llm.providers.form.name')}
            name="name"
            rules={[{ message: t('settings.llm.providers.form.nameRequired'), required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t('settings.llm.providers.form.providerType')}
            name="providerType"
            rules={[{ message: t('settings.llm.providers.form.providerTypeRequired'), required: true }]}
          >
            <Select disabled={!!dialog.record} options={providerTypeOptions} />
          </Form.Item>
          <Form.Item
            label={t('settings.llm.providers.form.apiFormat')}
            name="apiFormat"
            rules={[{ message: t('settings.llm.providers.form.apiFormatRequired'), required: true }]}
          >
            <Select options={apiFormatOptions} />
          </Form.Item>
          <Form.Item
            label={t('settings.llm.providers.form.baseUrl')}
            name="baseUrl"
            rules={[{ message: t('settings.llm.providers.form.baseUrlRequired'), required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            dependencies={['enabled']}
            extra={
              dialog.record?.hasApiKey
                ? t('settings.llm.providers.form.apiKeyHint')
                : t('settings.llm.providers.form.apiKeyRequiredWhenEnabled')
            }
            label={t('settings.llm.providers.form.apiKey')}
            name="apiKey"
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, value: string | undefined) => {
                  if (!getFieldValue('enabled') || dialog.record?.hasApiKey || value?.trim()) {
                    return Promise.resolve()
                  }

                  return Promise.reject(new Error(t('settings.llm.providers.form.apiKeyRequiredWhenEnabled')))
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label={t('settings.llm.providers.form.defaultModel')}
            name="defaultModel"
            rules={[{ message: t('settings.llm.providers.form.defaultModelRequired'), required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t('settings.llm.providers.form.timeoutMs')}
            name="timeoutMs"
            rules={[{ message: t('settings.llm.providers.form.timeoutMsRequired'), required: true }]}
          >
            <InputNumber className="w-full" max={120000} min={1000} step={1000} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function UseCasesSection() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [dialog, setDialog] = useState<DialogState<LlmUseCaseConfig>>({ open: false, record: null })

  const configsQuery = useLlmUseCaseConfigsQuery()
  const providersQuery = useLlmProvidersQuery()
  const updateMutation = useUpdateLlmUseCaseConfigMutation()

  const configs = useMemo(() => (configsQuery.data?.ok ? configsQuery.data.data.configs : []), [configsQuery.data])
  const providers = useMemo(
    () => (providersQuery.data?.ok ? providersQuery.data.data.providers : []),
    [providersQuery.data],
  )

  const providerOptions = useMemo(() => {
    return [
      { label: t('settings.llm.useCases.form.providerIdPlaceholder'), value: '' },
      ...providers.map((p) => ({ label: p.name, value: p.id })),
    ]
  }, [providers, t])

  useEffect(() => {
    if (!dialog.open || !dialog.record) return

    form.resetFields()
    form.setFieldsValue({
      enabled: dialog.record.enabled,
      maxOutputTokens: dialog.record.maxOutputTokens,
      model: dialog.record.model,
      providerId: dialog.record.providerId || '',
      temperature: dialog.record.temperature,
    })
  }, [dialog.open, dialog.record, form])

  const handleOpenEdit = useCallback((record: LlmUseCaseConfig) => {
    setDialog({ open: true, record })
  }, [])

  const handleSave = useCallback(async () => {
    if (!dialog.record) return
    const values = await form.validateFields()
    const payload = {
      enabled: values.enabled,
      maxOutputTokens: values.maxOutputTokens ?? null,
      model: values.model?.trim() || undefined,
      providerId: values.providerId || null,
      temperature: values.temperature ?? null,
    }

    const res = await updateMutation.mutateAsync({ payload, useCase: dialog.record.useCase })
    if (!res.ok) {
      message.error(res.error.message)
      return
    }
    message.success(t('settings.llm.saveSuccess'))
    setDialog({ open: false, record: null })
  }, [dialog.record, form, message, t, updateMutation])

  const columns = useMemo<TableProps<LlmUseCaseConfig>['columns']>(
    () => [
      {
        dataIndex: 'useCase',
        title: t('settings.llm.useCases.table.useCase'),
        render: (useCase: LlmUseCase) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-fg">{t(`settings.llm.useCases.useCase.${useCase}`)}</div>
            <div className="mt-1 truncate font-mono text-xs text-fg-muted">{useCase}</div>
          </div>
        ),
      },
      {
        dataIndex: 'enabled',
        title: t('settings.llm.useCases.table.status'),
        width: 90,
        render: (enabled: boolean) => (
          <Tag color={enabled ? 'success' : 'default'}>
            {enabled ? t('settings.llm.status.enabled') : t('settings.llm.status.disabled')}
          </Tag>
        ),
      },
      {
        dataIndex: 'provider',
        title: t('settings.llm.useCases.table.provider'),
        render: (provider: LlmProvider | null) =>
          provider ? <Tag>{provider.name}</Tag> : <span className="text-fg-muted">-</span>,
      },
      {
        dataIndex: 'model',
        title: t('settings.llm.useCases.table.model'),
        render: (model: string) => <span className="font-mono text-xs">{model}</span>,
      },
      {
        dataIndex: 'temperature',
        title: t('settings.llm.useCases.table.temperature'),
        width: 120,
        render: (val: number | null) => val ?? '-',
      },
      {
        dataIndex: 'maxOutputTokens',
        title: t('settings.llm.useCases.table.maxOutputTokens'),
        width: 120,
        render: (val: number | null) => val ?? '-',
      },
      {
        key: 'actions',
        title: t('settings.llm.useCases.table.actions'),
        width: 100,
        render: (_, record) => (
          <Button
            icon={<Pencil className="size-4" />}
            onClick={() => handleOpenEdit(record)}
            size="small"
            type="text"
          />
        ),
      },
    ],
    [handleOpenEdit, t],
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          icon={<RefreshCw className="size-4" />}
          loading={configsQuery.isFetching}
          onClick={() => configsQuery.refetch()}
        >
          {t('settings.llm.refresh')}
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <Table<LlmUseCaseConfig>
          columns={columns}
          dataSource={configs}
          loading={configsQuery.isLoading}
          locale={{ emptyText: t('settings.llm.useCases.emptyText') }}
          pagination={false}
          rowKey="useCase"
          scroll={{ x: 900 }}
        />
      </section>

      <Modal
        cancelText={t('settings.llm.cancel')}
        confirmLoading={updateMutation.isPending}
        destroyOnHidden
        okText={t('settings.llm.save')}
        onCancel={() => setDialog({ open: false, record: null })}
        onOk={handleSave}
        open={dialog.open}
        title={t('settings.llm.useCases.editTitle')}
      >
        <Form form={form} layout="vertical">
          <Form.Item label={t('settings.llm.useCases.form.enabled')} name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label={t('settings.llm.useCases.form.providerId')} name="providerId">
            <Select options={providerOptions} />
          </Form.Item>
          <Form.Item label={t('settings.llm.useCases.form.model')} name="model">
            <Input />
          </Form.Item>
          <Form.Item label={t('settings.llm.useCases.form.temperature')} name="temperature">
            <InputNumber className="w-full" max={2} min={0} step={0.1} />
          </Form.Item>
          <Form.Item label={t('settings.llm.useCases.form.maxOutputTokens')} name="maxOutputTokens">
            <InputNumber className="w-full" max={128000} min={1} step={128} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function CallLogsSection() {
  const { t } = useTranslation()
  const { message, modal } = App.useApp()
  const [query, setQuery] = useState<LlmCallLogListQuery>({ page: 1, pageSize: 20 })
  const [detailLog, setDetailLog] = useState<LlmCallLog | null>(null)

  const logsQuery = useLlmCallLogsQuery(query)
  const deleteExpiredMutation = useDeleteExpiredLlmCallLogsMutation()
  const providersQuery = useLlmProvidersQuery()

  const logs = useMemo(() => (logsQuery.data?.ok ? logsQuery.data.data.logs : []), [logsQuery.data])
  const total = useMemo(() => (logsQuery.data?.ok ? logsQuery.data.data.total : 0), [logsQuery.data])
  const providers = useMemo(
    () => (providersQuery.data?.ok ? providersQuery.data.data.providers : []),
    [providersQuery.data],
  )

  const providerOptions = useMemo(() => {
    return providers.map((p) => ({ label: p.name, value: p.id }))
  }, [providers])

  const dateTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }),
    [],
  )

  const handleTableChange = useCallback((pagination: LlmCallLogTablePagination) => {
    setQuery((prev: LlmCallLogListQuery) => ({
      ...prev,
      page: pagination.current ?? prev.page,
      pageSize: pagination.pageSize ?? prev.pageSize,
    }))
  }, [])

  const handleDeleteExpired = useCallback(() => {
    modal.confirm({
      title: t('settings.llm.callLogs.deleteExpired'),
      content: t('settings.llm.callLogs.deleteExpired'),
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await deleteExpiredMutation.mutateAsync()
        if (!res.ok) {
          message.error(res.error.message)
          return
        }
        message.success(t('settings.llm.callLogs.deleteExpiredSuccess'))
      },
    })
  }, [deleteExpiredMutation, message, modal, t])

  const columns = useMemo<TableProps<LlmCallLog>['columns']>(
    () => [
      {
        dataIndex: 'operation',
        title: t('settings.llm.callLogs.table.operation'),
        render: (op: LlmCallOperation, record: LlmCallLog) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-fg">{op}</div>
            {record.useCase && <div className="mt-1 truncate font-mono text-xs text-fg-muted">{record.useCase}</div>}
          </div>
        ),
      },
      {
        dataIndex: 'status',
        title: t('settings.llm.callLogs.table.status'),
        width: 90,
        render: (status: LlmCallStatus) => (
          <Tag color={status === 'success' ? 'success' : 'error'}>{t(`settings.llm.callLogs.status.${status}`)}</Tag>
        ),
      },
      {
        dataIndex: 'providerName',
        title: t('settings.llm.callLogs.table.provider'),
        render: (name: string, record: LlmCallLog) => (
          <div className="min-w-0">
            <div className="truncate text-fg">{name}</div>
            <div className="mt-1 truncate font-mono text-xs text-fg-muted">{record.model}</div>
          </div>
        ),
      },
      {
        dataIndex: 'durationMs',
        title: t('settings.llm.callLogs.table.duration'),
        width: 100,
        render: (ms: number | null) => (ms ? `${ms}ms` : '-'),
      },
      {
        dataIndex: 'totalTokens',
        title: t('settings.llm.callLogs.table.tokens'),
        width: 140,
        render: (_totalTokens: LlmCallLog['totalTokens'], record: LlmCallLog) => (
          <span className="text-xs">
            {record.totalTokens ?? '-'}
            {' / '}
            {record.inputTokens ?? '-'}
            {' / '}
            {record.outputTokens ?? '-'}
          </span>
        ),
      },
      {
        dataIndex: 'startedAt',
        title: t('settings.llm.callLogs.table.startedAt'),
        width: 180,
        render: (value: string) => dateTimeFormatter.format(new Date(value)),
      },
      {
        key: 'actions',
        title: t('settings.llm.callLogs.table.actions'),
        width: 80,
        render: (_, record) => (
          <Button icon={<Eye className="size-4" />} onClick={() => setDetailLog(record)} size="small" type="text" />
        ),
      },
    ],
    [dateTimeFormatter, t],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Space className="flex-wrap" size="small">
          <Select
            allowClear
            className="w-36"
            onChange={(v) => setQuery((p: LlmCallLogListQuery) => ({ ...p, status: v, page: 1 }))}
            options={[
              { label: t('settings.llm.callLogs.status.success'), value: 'success' },
              { label: t('settings.llm.callLogs.status.error'), value: 'error' },
            ]}
            placeholder={t('settings.llm.callLogs.table.status')}
            value={query.status}
          />
          <Select
            allowClear
            className="w-40"
            onChange={(v) => setQuery((p: LlmCallLogListQuery) => ({ ...p, providerId: v, page: 1 }))}
            options={providerOptions}
            placeholder={t('settings.llm.callLogs.table.provider')}
            value={query.providerId}
          />
          <Input
            allowClear
            className="w-40"
            onChange={(e) =>
              setQuery((p: LlmCallLogListQuery) => ({ ...p, model: e.target.value || undefined, page: 1 }))
            }
            placeholder={t('settings.llm.callLogs.table.model')}
            value={query.model}
          />
          <Input
            allowClear
            className="w-48"
            onChange={(e) =>
              setQuery((p: LlmCallLogListQuery) => ({ ...p, requestId: e.target.value || undefined, page: 1 }))
            }
            placeholder={t('settings.llm.callLogs.table.requestId')}
            value={query.requestId}
          />
        </Space>
        <Space>
          <Button icon={<Trash2 className="size-4" />} onClick={handleDeleteExpired}>
            {t('settings.llm.callLogs.deleteExpired')}
          </Button>
          <Button
            icon={<RefreshCw className="size-4" />}
            loading={logsQuery.isFetching}
            onClick={() => logsQuery.refetch()}
          >
            {t('settings.llm.refresh')}
          </Button>
        </Space>
      </div>

      <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <Table<LlmCallLog>
          columns={columns}
          dataSource={logs}
          loading={logsQuery.isLoading}
          locale={{ emptyText: t('settings.llm.callLogs.emptyText') }}
          onChange={handleTableChange}
          pagination={{ current: query.page, pageSize: query.pageSize, showSizeChanger: false, total }}
          rowKey="id"
          scroll={{ x: 1000 }}
        />
      </section>

      <Drawer
        onClose={() => setDetailLog(null)}
        open={!!detailLog}
        size="large"
        title={t('settings.llm.callLogs.detailTitle')}
      >
        {detailLog && (
          <div className="space-y-6">
            <section>
              <h3 className="mb-3 font-medium text-fg">{t('settings.llm.callLogs.table.operation')}</h3>
              <div className="rounded bg-surface-subtle p-3 font-mono text-sm">{detailLog.operation}</div>
            </section>
            <section>
              <h3 className="mb-3 font-medium text-fg">{t('settings.llm.callLogs.table.provider')}</h3>
              <div className="rounded bg-surface-subtle p-3 text-sm">
                <div>
                  {detailLog.providerName} ({detailLog.providerType})
                </div>
                <div className="mt-1 text-fg-muted">{detailLog.providerBaseUrl}</div>
                <div className="mt-2 text-xs">
                  ID: {detailLog.providerId} &middot; Exists: {String(detailLog.providerCurrentExists)} &middot;
                  Enabled: {String(detailLog.providerCurrentEnabled)}
                </div>
              </div>
            </section>
            <section>
              <h3 className="mb-3 font-medium text-fg">{t('settings.llm.callLogs.table.model')}</h3>
              <div className="rounded bg-surface-subtle p-3 font-mono text-sm">{detailLog.model}</div>
            </section>
            {detailLog.errorType && (
              <section>
                <h3 className="mb-3 font-medium text-danger">{t('settings.llm.callLogs.status.error')}</h3>
                <div className="rounded border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
                  <div>Type: {detailLog.errorType}</div>
                  <div>Code: {detailLog.errorCode}</div>
                  <div>Status: {detailLog.errorStatus}</div>
                  <div className="mt-2 font-mono">{detailLog.errorMessage}</div>
                </div>
              </section>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

export function LlmSettings() {
  const { t } = useTranslation()

  const tabs = useMemo(
    () => [
      {
        children: <ProviderSection />,
        key: 'providers',
        label: t('settings.llm.tabs.providers'),
      },
      {
        children: <UseCasesSection />,
        key: 'use-cases',
        label: t('settings.llm.tabs.useCases'),
      },
      {
        children: <CallLogsSection />,
        key: 'call-logs',
        label: t('settings.llm.tabs.callLogs'),
      },
    ],
    [t],
  )

  return (
    <div className="space-y-6">
      <FifaPageHeader description={t('settings.llm.description')} title={t('settings.llm.title')} />

      <Tabs items={tabs} />
    </div>
  )
}
