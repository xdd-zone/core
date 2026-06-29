import type {
  LlmApiFormat,
  LlmProvider,
  LlmUseCase,
  LlmUseCaseConfig,
  UpdateLlmUseCaseConfigRequest,
} from '@xdd-zone/contracts'
import type { TableProps } from 'antd'
import type { TFunction } from 'i18next'
import { useLlmUseCaseConfigsQuery, useUpdateLlmUseCaseConfigMutation } from '@fifa/api/llm'
import { FifaPageHeader } from '@fifa/components/common'
import { App, Button, Form, Input, InputNumber, Modal, Select, Switch, Table, Tag } from 'antd'
import { Pencil, RefreshCw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface LlmConfigFormValue {
  apiFormat: LlmApiFormat
  baseUrl?: string
  enabled: boolean
  maxOutputTokens?: number
  model: string
  provider: LlmProvider
  temperature?: number
  timeoutMs: number
}

interface DialogState {
  config: LlmUseCaseConfig | null
  open: boolean
}

const emptyDialog: DialogState = {
  config: null,
  open: false,
}

const tablePagination = {
  pageSize: 8,
  showSizeChanger: false,
}

const apiFormatLabelKeys: Record<LlmApiFormat, string> = {
  chat_completions: 'settings.llm.apiFormat.chatCompletions',
  responses: 'settings.llm.apiFormat.responses',
}

const useCaseLabelKeys: Record<LlmUseCase, string> = {
  'content.post.meta': 'settings.llm.useCase.contentPostMeta',
}

function getApiFormatLabel(t: TFunction, apiFormat: LlmApiFormat) {
  return t(apiFormatLabelKeys[apiFormat])
}

function getUseCaseLabel(t: TFunction, useCase: LlmUseCase) {
  return t(useCaseLabelKeys[useCase])
}

function toFormValues(config: LlmUseCaseConfig): LlmConfigFormValue {
  return {
    apiFormat: config.apiFormat,
    baseUrl: config.baseUrl ?? undefined,
    enabled: config.enabled,
    maxOutputTokens: config.maxOutputTokens ?? undefined,
    model: config.model,
    provider: config.provider,
    temperature: config.temperature ?? undefined,
    timeoutMs: config.timeoutMs,
  }
}

function toPayload(values: LlmConfigFormValue): UpdateLlmUseCaseConfigRequest {
  return {
    apiFormat: values.apiFormat,
    baseUrl: values.baseUrl?.trim() || null,
    enabled: values.enabled,
    maxOutputTokens: values.maxOutputTokens ?? null,
    model: values.model.trim(),
    provider: values.provider,
    temperature: values.temperature ?? null,
    timeoutMs: values.timeoutMs,
  }
}

export function LlmSettings() {
  const { i18n, t } = useTranslation()
  const { message } = App.useApp()
  const [form] = Form.useForm<LlmConfigFormValue>()
  const [dialog, setDialog] = useState<DialogState>(emptyDialog)
  const configsQuery = useLlmUseCaseConfigsQuery()
  const updateMutation = useUpdateLlmUseCaseConfigMutation()

  const configs = useMemo(() => (configsQuery.data?.ok ? configsQuery.data.data.configs : []), [configsQuery.data])
  const loadError = configsQuery.data && !configsQuery.data.ok ? configsQuery.data.error.message : undefined

  const summaryItems = useMemo(
    () => [
      { label: t('settings.llm.summary.useCases'), value: configs.length },
      { label: t('settings.llm.summary.enabled'), value: configs.filter((config) => config.enabled).length },
    ],
    [configs, t],
  )

  const providerOptions = useMemo(
    () => [
      { label: t('settings.llm.provider.none'), value: 'none' },
      { label: t('settings.llm.provider.openai'), value: 'openai' },
    ],
    [t],
  )

  const apiFormatOptions = useMemo(
    () => [
      { label: getApiFormatLabel(t, 'chat_completions'), value: 'chat_completions' },
      { label: getApiFormatLabel(t, 'responses'), value: 'responses' },
    ],
    [t],
  )

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'zh-CN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [i18n.language],
  )

  const handleOpenEdit = useCallback(
    (config: LlmUseCaseConfig) => {
      form.setFieldsValue(toFormValues(config))
      setDialog({ config, open: true })
    },
    [form],
  )

  const handleSave = useCallback(async () => {
    if (!dialog.config) {
      return
    }

    const values = await form.validateFields()
    const response = await updateMutation.mutateAsync({
      payload: toPayload(values),
      useCase: dialog.config.useCase,
    })

    if (!response.ok) {
      message.error(response.error.message)
      return
    }

    message.success(t('settings.llm.saveSuccess'))
    setDialog(emptyDialog)
    form.resetFields()
  }, [dialog.config, form, message, t, updateMutation])

  const columns = useMemo<TableProps<LlmUseCaseConfig>['columns']>(
    () => [
      {
        dataIndex: 'useCase',
        title: t('settings.llm.table.useCase'),
        render: (useCase: LlmUseCase) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-fg">{getUseCaseLabel(t, useCase)}</div>
            <div className="mt-1 truncate font-mono text-xs text-fg-muted">{useCase}</div>
          </div>
        ),
      },
      {
        dataIndex: 'enabled',
        title: t('settings.llm.table.status'),
        width: 110,
        render: (enabled: boolean) => (
          <Tag color={enabled ? 'success' : 'default'}>
            {enabled ? t('settings.llm.status.enabled') : t('settings.llm.status.disabled')}
          </Tag>
        ),
      },
      {
        dataIndex: 'provider',
        title: t('settings.llm.table.provider'),
        width: 120,
        render: (provider: LlmProvider) => <Tag>{t(`settings.llm.provider.${provider}`)}</Tag>,
      },
      {
        dataIndex: 'model',
        title: t('settings.llm.table.model'),
        render: (model: string) => <span className="font-mono text-xs">{model}</span>,
      },
      {
        dataIndex: 'apiFormat',
        title: t('settings.llm.table.apiFormat'),
        width: 190,
        render: (apiFormat: LlmApiFormat) => getApiFormatLabel(t, apiFormat),
      },
      {
        dataIndex: 'timeoutMs',
        title: t('settings.llm.table.timeoutMs'),
        width: 120,
      },
      {
        dataIndex: 'hasApiKey',
        title: t('settings.llm.table.apiKey'),
        width: 120,
        render: (hasApiKey: boolean) => (
          <Tag color={hasApiKey ? 'success' : 'warning'}>
            {hasApiKey ? t('settings.llm.apiKey.configured') : t('settings.llm.apiKey.missing')}
          </Tag>
        ),
      },
      {
        dataIndex: 'updatedAt',
        title: t('settings.llm.table.updatedAt'),
        width: 180,
        render: (value: string) => dateTimeFormatter.format(new Date(value)),
      },
      {
        key: 'actions',
        title: t('settings.llm.table.actions'),
        width: 110,
        render: (_, config) => (
          <Button icon={<Pencil className="size-4" />} onClick={() => handleOpenEdit(config)} size="small">
            {t('settings.llm.edit')}
          </Button>
        ),
      },
    ],
    [dateTimeFormatter, handleOpenEdit, t],
  )

  return (
    <div className="space-y-5">
      <FifaPageHeader
        actions={
          <Button
            icon={<RefreshCw className="size-4" />}
            loading={configsQuery.isFetching}
            onClick={() => void configsQuery.refetch()}
          >
            {t('settings.llm.refresh')}
          </Button>
        }
        description={t('settings.llm.description')}
        summaryItems={summaryItems}
        title={t('settings.llm.title')}
      />

      <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        {loadError ? (
          <div className="border-b border-border-subtle px-4 py-3 text-sm text-danger">{loadError}</div>
        ) : null}
        <Table<LlmUseCaseConfig>
          columns={columns}
          dataSource={configs}
          loading={configsQuery.isLoading}
          locale={{ emptyText: t('settings.llm.emptyText') }}
          pagination={tablePagination}
          rowKey="useCase"
          scroll={{ x: 1180 }}
        />
      </section>

      <Modal
        cancelText={t('settings.llm.cancel')}
        confirmLoading={updateMutation.isPending}
        destroyOnHidden
        okText={t('settings.llm.save')}
        onCancel={() => {
          setDialog(emptyDialog)
          form.resetFields()
        }}
        onOk={() => void handleSave()}
        open={dialog.open}
        title={t('settings.llm.editTitle')}
      >
        <Form<LlmConfigFormValue> form={form} layout="vertical">
          <Form.Item name="enabled" label={t('settings.llm.form.enabled')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            name="provider"
            label={t('settings.llm.form.provider')}
            rules={[{ message: t('settings.llm.form.providerRequired'), required: true }]}
          >
            <Select options={providerOptions} />
          </Form.Item>
          <Form.Item
            name="model"
            label={t('settings.llm.form.model')}
            rules={[{ message: t('settings.llm.form.modelRequired'), required: true }]}
          >
            <Input placeholder={t('settings.llm.form.modelPlaceholder')} />
          </Form.Item>
          <Form.Item
            name="apiFormat"
            label={t('settings.llm.form.apiFormat')}
            rules={[{ message: t('settings.llm.form.apiFormatRequired'), required: true }]}
          >
            <Select options={apiFormatOptions} />
          </Form.Item>
          <Form.Item name="baseUrl" label={t('settings.llm.form.baseUrl')}>
            <Input placeholder={t('settings.llm.form.baseUrlPlaceholder')} />
          </Form.Item>
          <Form.Item
            name="timeoutMs"
            label={t('settings.llm.form.timeoutMs')}
            rules={[{ message: t('settings.llm.form.timeoutMsRequired'), required: true }]}
          >
            <InputNumber className="w-full" min={1} max={120000} step={1000} />
          </Form.Item>
          <Form.Item name="temperature" label={t('settings.llm.form.temperature')}>
            <InputNumber className="w-full" min={0} max={2} step={0.1} />
          </Form.Item>
          <Form.Item name="maxOutputTokens" label={t('settings.llm.form.maxOutputTokens')}>
            <InputNumber className="w-full" min={1} max={128000} step={128} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
