import type { SiteConfig } from '@console/modules/site-config'

import { createPermissionKeySet } from '@console/app/access/access-control'
import { useCurrentUserPermissionsQuery } from '@console/modules/rbac'
import {
  SITE_CONFIG_QUERY_KEY,
  SiteConfigRequestError,
  useSiteConfigQuery,
  useUpdateSiteConfigMutation,
} from '@console/modules/site-config'
import { useQueryClient } from '@tanstack/react-query'

import { Permissions } from '@xdd-zone/nexus/permissions'
import { App as AntdApp, Button, Card, Empty, Form, Input, Space, Tag } from 'antd'
import { ImagePlus, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { canUsePermission } from '../shared/content-utils'
import { ARTICLE_PAGE_CLASSNAME } from '../shared/page-layout'

interface SocialLinkEntry {
  platform?: string
  url?: string
}

interface SiteConfigFormValues {
  defaultSeoDescription?: string | null
  defaultSeoTitle?: string | null
  description?: string | null
  favicon?: string | null
  footerText?: string | null
  logo?: string | null
  socialLinksEntries?: SocialLinkEntry[]
  subtitle?: string | null
  title?: string
}

function trimNullable(value?: string | null) {
  const nextValue = value?.trim()
  return nextValue || null
}

function entriesFromSocialLinks(siteConfig?: SiteConfig) {
  return Object.entries(siteConfig?.socialLinks ?? {}).map(([platform, url]) => ({ platform, url }))
}

function socialLinksFromEntries(entries?: SocialLinkEntry[]) {
  return Object.fromEntries(
    (entries ?? [])
      .map((entry) => ({
        platform: entry.platform?.trim(),
        url: entry.url?.trim(),
      }))
      .filter((entry): entry is { platform: string; url: string } => Boolean(entry.platform && entry.url))
      .map(({ platform, url }) => [platform, url] as const),
  )
}

function buildSiteConfigFormValues(siteConfig?: SiteConfig): SiteConfigFormValues {
  return {
    defaultSeoDescription: siteConfig?.defaultSeoDescription,
    defaultSeoTitle: siteConfig?.defaultSeoTitle,
    description: siteConfig?.description,
    favicon: siteConfig?.favicon,
    footerText: siteConfig?.footerText,
    logo: siteConfig?.logo,
    socialLinksEntries: entriesFromSocialLinks(siteConfig),
    subtitle: siteConfig?.subtitle,
    title: siteConfig?.title,
  }
}

/**
 * 内容设置页面。
 */
export function ArticleSettings() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<SiteConfigFormValues>()
  const hydratedSiteConfigSnapshotRef = useRef<string | null>(null)
  const isEditingSiteConfigRef = useRef(false)

  const currentUserPermissionsQuery = useCurrentUserPermissionsQuery()
  const permissionKeys = createPermissionKeySet(currentUserPermissionsQuery.data?.permissions)
  const canReadSiteConfig = canUsePermission(permissionKeys, Permissions.SITE_CONFIG.READ)
  const canWriteSiteConfig = canUsePermission(permissionKeys, Permissions.SITE_CONFIG.WRITE)

  const siteConfigQuery = useSiteConfigQuery(canReadSiteConfig)
  const updateSiteConfigMutation = useUpdateSiteConfigMutation()
  const siteConfigFormValues = useMemo(() => buildSiteConfigFormValues(siteConfigQuery.data), [siteConfigQuery.data])

  useEffect(() => {
    if (!siteConfigQuery.data) {
      return
    }

    const nextSnapshot = JSON.stringify(siteConfigFormValues)

    if (isEditingSiteConfigRef.current || hydratedSiteConfigSnapshotRef.current === nextSnapshot) {
      return
    }

    form.setFieldsValue(siteConfigFormValues)
    hydratedSiteConfigSnapshotRef.current = nextSnapshot
  }, [form, siteConfigFormValues, siteConfigQuery.data])

  const summaryItems = [
    {
      label: t('content.settings.summary.title'),
      value: siteConfigQuery.data?.title || t('content.settings.summary.empty'),
    },
    {
      label: t('content.settings.summary.links'),
      value: canReadSiteConfig ? String(Object.keys(siteConfigQuery.data?.socialLinks ?? {}).length) : '-',
    },
  ]

  const handleSaveSiteConfig = async (values: SiteConfigFormValues) => {
    try {
      const updatedConfig = await updateSiteConfigMutation.mutateAsync({
        defaultSeoDescription: trimNullable(values.defaultSeoDescription),
        defaultSeoTitle: trimNullable(values.defaultSeoTitle),
        description: trimNullable(values.description),
        favicon: trimNullable(values.favicon),
        footerText: trimNullable(values.footerText),
        logo: trimNullable(values.logo),
        socialLinks: socialLinksFromEntries(values.socialLinksEntries),
        subtitle: trimNullable(values.subtitle),
        title: values.title?.trim() || undefined,
      })

      const nextFormValues = buildSiteConfigFormValues(updatedConfig)
      queryClient.setQueryData(SITE_CONFIG_QUERY_KEY, updatedConfig)
      form.setFieldsValue(nextFormValues)
      hydratedSiteConfigSnapshotRef.current = JSON.stringify(nextFormValues)
      isEditingSiteConfigRef.current = false
      message.success(t('content.settings.messages.saved'))
    } catch (error) {
      const errorMessage = error instanceof SiteConfigRequestError ? error.message : t('common.error')
      message.error(errorMessage)
    }
  }

  const resetSiteConfigForm = () => {
    form.setFieldsValue(siteConfigFormValues)
    hydratedSiteConfigSnapshotRef.current = JSON.stringify(siteConfigFormValues)
    isEditingSiteConfigRef.current = false
  }

  return (
    <div className={ARTICLE_PAGE_CLASSNAME}>
      <section className="rounded-2xl border border-border-subtle bg-surface/72 px-4 py-4 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 max-w-2xl">
            <h1 className="text-fg text-xl font-semibold tracking-tight">{t('content.settings.title')}</h1>
            <p className="text-fg-muted mt-1.5 text-sm">{t('content.settings.description')}</p>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-[44%] xl:justify-end">
            {summaryItems.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-overlay-0/16 px-2.5 py-1 text-xs"
              >
                <span className="text-fg-muted">{item.label}</span>
                <span className="font-medium text-fg">{item.value}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <Card
        className="overflow-hidden rounded-2xl"
        title={t('content.settings.form.title')}
        extra={
          <Space wrap>
            <Button icon={<RefreshCw className="size-4" />} onClick={resetSiteConfigForm}>
              {t('common.reset')}
            </Button>
            <Button
              type="primary"
              disabled={!canWriteSiteConfig}
              loading={updateSiteConfigMutation.isPending}
              onClick={() => void form.submit()}
            >
              {t('common.save')}
            </Button>
          </Space>
        }
      >
        {canReadSiteConfig || canWriteSiteConfig ? (
          <>
            <p className="text-fg-muted mb-5 text-sm">{t('content.settings.form.description')}</p>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveSiteConfig}
              onValuesChange={() => {
                isEditingSiteConfigRef.current = true
              }}
            >
              <div className="grid gap-x-5 md:grid-cols-2">
                <Form.Item
                  label={t('content.settings.form.fields.title')}
                  name="title"
                  rules={[{ required: true, message: t('content.settings.form.validation.titleRequired') }]}
                >
                  <Input disabled={!canWriteSiteConfig} placeholder={t('content.settings.form.placeholders.title')} />
                </Form.Item>

                <Form.Item label={t('content.settings.form.fields.subtitle')} name="subtitle">
                  <Input
                    disabled={!canWriteSiteConfig}
                    placeholder={t('content.settings.form.placeholders.subtitle')}
                  />
                </Form.Item>

                <Form.Item
                  className="md:col-span-2"
                  label={t('content.settings.form.fields.description')}
                  name="description"
                >
                  <Input.TextArea
                    disabled={!canWriteSiteConfig}
                    rows={4}
                    placeholder={t('content.settings.form.placeholders.description')}
                  />
                </Form.Item>

                <Form.Item label={t('content.settings.form.fields.logo')} name="logo">
                  <Input disabled={!canWriteSiteConfig} placeholder={t('content.settings.form.placeholders.logo')} />
                </Form.Item>

                <Form.Item label={t('content.settings.form.fields.favicon')} name="favicon">
                  <Input
                    disabled={!canWriteSiteConfig}
                    placeholder={t('content.settings.form.placeholders.favicon')}
                  />
                </Form.Item>

                <Form.Item
                  className="md:col-span-2"
                  label={t('content.settings.form.fields.footerText')}
                  name="footerText"
                >
                  <Input
                    disabled={!canWriteSiteConfig}
                    placeholder={t('content.settings.form.placeholders.footerText')}
                  />
                </Form.Item>

                <Form.Item label={t('content.settings.form.fields.defaultSeoTitle')} name="defaultSeoTitle">
                  <Input
                    disabled={!canWriteSiteConfig}
                    placeholder={t('content.settings.form.placeholders.defaultSeoTitle')}
                  />
                </Form.Item>

                <Form.Item
                  label={t('content.settings.form.fields.defaultSeoDescription')}
                  name="defaultSeoDescription"
                >
                  <Input
                    disabled={!canWriteSiteConfig}
                    placeholder={t('content.settings.form.placeholders.defaultSeoDescription')}
                  />
                </Form.Item>
              </div>

              <div className="mt-2">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-fg">{t('content.settings.form.fields.socialLinks')}</div>
                    <div className="text-fg-muted mt-1 text-xs">{t('content.settings.form.socialLinksHint')}</div>
                  </div>
                  <Tag>{t('content.settings.form.socialLinksTag')}</Tag>
                </div>

                <Form.List name="socialLinksEntries">
                  {(fields, { add, remove }) => (
                    <div className="space-y-3">
                      {fields.map((field) => (
                        <div
                          key={field.key}
                          className="grid gap-3 rounded-2xl border border-border-subtle bg-surface-subtle/18 p-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto]"
                        >
                          <Form.Item
                            className="mb-0"
                            name={[field.name, 'platform']}
                            rules={[
                              { required: true, message: t('content.settings.form.validation.platformRequired') },
                            ]}
                          >
                            <Input
                              disabled={!canWriteSiteConfig}
                              placeholder={t('content.settings.form.placeholders.socialPlatform')}
                            />
                          </Form.Item>
                          <Form.Item
                            className="mb-0"
                            name={[field.name, 'url']}
                            rules={[{ required: true, message: t('content.settings.form.validation.urlRequired') }]}
                          >
                            <Input
                              disabled={!canWriteSiteConfig}
                              placeholder={t('content.settings.form.placeholders.socialUrl')}
                            />
                          </Form.Item>
                          <Button
                            danger
                            disabled={!canWriteSiteConfig}
                            type="text"
                            onClick={() => remove(field.name)}
                          >
                            {t('common.delete')}
                          </Button>
                        </div>
                      ))}

                      <Button
                        block
                        disabled={!canWriteSiteConfig}
                        icon={<ImagePlus className="size-4" />}
                        type="dashed"
                        onClick={() => add({ platform: '', url: '' })}
                      >
                        {t('content.settings.form.socialLinksAdd')}
                      </Button>
                    </div>
                  )}
                </Form.List>
              </div>
            </Form>
          </>
        ) : (
          <Empty description={t('content.settings.form.unavailable')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  )
}
