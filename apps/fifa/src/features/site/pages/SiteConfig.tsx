import type { SiteHomeSection, SiteNavigationItem, UpdateSiteConfigRequest } from '@xdd-zone/contracts'

import { useSiteConfigQuery, useUpdateSiteConfigMutation } from '@fifa/api/site'
import { FifaPageHeader } from '@fifa/components/common'
import { Alert, App, Button, Form, Input, Spin } from 'antd'
import { RefreshCw, Save } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface SiteConfigFormValues {
  homeSectionsJson: string
  navigationJson: string
  seoDescription: string
  seoTitle: string
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function parseJsonArray<T>(value: string, fieldName: string): T[] {
  const parsed = JSON.parse(value) as unknown

  if (!Array.isArray(parsed)) {
    throw new TypeError(`${fieldName} 必须是 JSON 数组`)
  }

  return parsed as T[]
}

export function SiteConfig() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const [form] = Form.useForm<SiteConfigFormValues>()
  const query = useSiteConfigQuery()
  const updateMutation = useUpdateSiteConfigMutation()
  const site = query.data?.ok ? query.data.data.site : null
  const loadError = query.data && !query.data.ok ? query.data.error.message : undefined

  useEffect(() => {
    if (!site) {
      return
    }

    form.setFieldsValue({
      homeSectionsJson: formatJson(site.homeSections),
      navigationJson: formatJson(site.navigation),
      seoDescription: site.seo.description ?? '',
      seoTitle: site.seo.title,
    })
  }, [form, site])

  const summaryItems = useMemo(
    () => [
      { label: t('site.config.summary.siteKey'), value: site?.siteKey ?? '-' },
      { label: t('site.config.summary.navigation'), value: site?.navigation.length ?? 0 },
      { label: t('site.config.summary.homeSections'), value: site?.homeSections.length ?? 0 },
    ],
    [site, t],
  )

  const handleSave = async () => {
    const values = await form.validateFields()
    let payload: UpdateSiteConfigRequest

    try {
      payload = {
        homeSections: parseJsonArray<SiteHomeSection>(values.homeSectionsJson, t('site.config.homeSections')),
        navigation: parseJsonArray<SiteNavigationItem>(values.navigationJson, t('site.config.navigation')),
        seo: {
          description: values.seoDescription.trim() ? values.seoDescription.trim() : null,
          title: values.seoTitle.trim(),
        },
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('site.config.invalidJson'))
      return
    }

    const response = await updateMutation.mutateAsync(payload)

    if (!response.ok) {
      message.error(response.error.message)
      return
    }

    message.success(t('site.config.saveSuccess'))
  }

  if (query.isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Spin />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <FifaPageHeader
        title={t('site.config.title')}
        description={t('site.config.description')}
        actions={
          <>
            <Button icon={<RefreshCw className="size-4" />} loading={query.isFetching} onClick={() => query.refetch()}>
              {t('site.config.refresh')}
            </Button>
            <Button
              type="primary"
              icon={<Save className="size-4" />}
              loading={updateMutation.isPending}
              onClick={() => void handleSave()}
            >
              {t('site.config.save')}
            </Button>
          </>
        }
        summaryItems={summaryItems}
      />

      {loadError ? <Alert type="error" showIcon message={t('site.config.loadFailed')} description={loadError} /> : null}

      {site ? (
        <section className="rounded-lg border border-border-subtle bg-surface">
          <div className="border-b border-border-subtle px-5 py-4">
            <div className="text-sm font-medium text-fg">{t('site.config.formTitle')}</div>
            <p className="mt-1 text-sm text-fg-muted">{t('site.config.formDescription')}</p>
          </div>
          <div className="p-5">
            <Form form={form} layout="vertical">
              <div className="grid gap-4 md:grid-cols-2">
                <Form.Item
                  name="seoTitle"
                  label={t('site.config.seoTitle')}
                  rules={[{ required: true, message: t('site.config.seoTitleRequired') }]}
                >
                  <Input placeholder={t('site.config.seoTitlePlaceholder')} />
                </Form.Item>
                <Form.Item name="seoDescription" label={t('site.config.seoDescription')}>
                  <Input placeholder={t('site.config.seoDescriptionPlaceholder')} />
                </Form.Item>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Form.Item
                  name="navigationJson"
                  label={t('site.config.navigation')}
                  rules={[{ required: true, message: t('site.config.navigationRequired') }]}
                >
                  <Input.TextArea autoSize={{ minRows: 12, maxRows: 18 }} />
                </Form.Item>
                <Form.Item
                  name="homeSectionsJson"
                  label={t('site.config.homeSections')}
                  rules={[{ required: true, message: t('site.config.homeSectionsRequired') }]}
                >
                  <Input.TextArea autoSize={{ minRows: 12, maxRows: 18 }} />
                </Form.Item>
              </div>
            </Form>
          </div>
        </section>
      ) : null}
    </div>
  )
}
