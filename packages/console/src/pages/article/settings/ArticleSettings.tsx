import type { Media } from '@console/modules/media'
import type { SiteConfig } from '@console/modules/site-config'
import type { TableProps } from 'antd'

import { createPermissionKeySet } from '@console/app/access/access-control'
import {
  MEDIA_LIST_QUERY_KEY,
  MediaRequestError,
  useDeleteMediaMutation,
  useMediaListQuery,
  useUploadMediaMutation,
} from '@console/modules/media'
import { useCurrentUserPermissionsQuery } from '@console/modules/rbac'
import {
  SITE_CONFIG_QUERY_KEY,
  SiteConfigRequestError,
  useSiteConfigQuery,
  useUpdateSiteConfigMutation,
} from '@console/modules/site-config'
import { resolveApiUrl } from '@console/shared/api'
import { useQueryClient } from '@tanstack/react-query'

import { Permissions } from '@xdd-zone/nexus/permissions'
import { App as AntdApp, Button, Card, Descriptions, Empty, Form, Input, Popconfirm, Space, Table, Tag } from 'antd'
import dayjs from 'dayjs'
import { Copy, ExternalLink, ImagePlus, RefreshCw, Trash2, Upload } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { canUsePermission } from '../shared/content-utils'
import {
  ARTICLE_PAGE_CLASSNAME,
  ARTICLE_PANEL_BODY_STYLE,
  ARTICLE_PANEL_CLASSNAME,
  ARTICLE_TABLE_CLASSNAME,
} from '../shared/page-layout'

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

const MEDIA_PAGE_SIZE = 12
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024

function trimNullable(value?: string | null) {
  const nextValue = value?.trim()
  return nextValue || null
}

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  const kb = size / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }

  return `${(kb / 1024).toFixed(1)} MB`
}

function isImageMimeType(mimeType: string) {
  return mimeType.startsWith('image/')
}

function mediaUrl(media: Media) {
  return resolveApiUrl(media.url)
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
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const hydratedSiteConfigSnapshotRef = useRef<string | null>(null)
  const isEditingSiteConfigRef = useRef(false)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(MEDIA_PAGE_SIZE)

  const currentUserPermissionsQuery = useCurrentUserPermissionsQuery()
  const permissionKeys = createPermissionKeySet(currentUserPermissionsQuery.data?.permissions)
  const canReadSiteConfig = canUsePermission(permissionKeys, Permissions.SITE_CONFIG.READ)
  const canWriteSiteConfig = canUsePermission(permissionKeys, Permissions.SITE_CONFIG.WRITE)
  const canReadMedia = canUsePermission(permissionKeys, Permissions.MEDIA.READ_ALL)
  const canWriteMedia = canUsePermission(permissionKeys, Permissions.MEDIA.WRITE_ALL)

  const siteConfigQuery = useSiteConfigQuery(canReadSiteConfig)
  const mediaListQuery = useMediaListQuery({ page, pageSize }, canReadMedia)
  const updateSiteConfigMutation = useUpdateSiteConfigMutation()
  const uploadMediaMutation = useUploadMediaMutation()
  const deleteMediaMutation = useDeleteMediaMutation()
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

  const refreshMediaList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: MEDIA_LIST_QUERY_KEY })
  }, [queryClient])

  const summaryItems = [
    {
      label: t('content.settings.summary.title'),
      value: siteConfigQuery.data?.title || t('content.settings.summary.empty'),
    },
    {
      label: t('content.settings.summary.media'),
      value: canReadMedia ? String(mediaListQuery.data?.total ?? 0) : '-',
    },
    {
      label: t('content.settings.summary.links'),
      value: canReadSiteConfig ? String(Object.keys(siteConfigQuery.data?.socialLinks ?? {}).length) : '-',
    },
  ]

  const handleDeleteMedia = useCallback(
    async (id: string) => {
      try {
        await deleteMediaMutation.mutateAsync(id)
        await refreshMediaList()
        message.success(t('content.settings.media.deleted'))
      } catch (error) {
        const errorMessage = error instanceof MediaRequestError ? error.message : t('common.error')
        message.error(errorMessage)
      }
    },
    [deleteMediaMutation, message, refreshMediaList, t],
  )

  const columns = useMemo<TableProps<Media>['columns']>(
    () => [
      {
        key: 'preview',
        title: t('content.settings.media.columns.preview'),
        width: 120,
        render: (_, record) =>
          isImageMimeType(record.mimeType) ? (
            <img
              alt={record.originalName}
              className="h-14 w-20 rounded-xl border border-border-subtle object-cover"
              src={mediaUrl(record)}
            />
          ) : (
            <div className="flex h-14 w-20 items-center justify-center rounded-xl border border-border-subtle bg-surface-subtle/25 text-xs text-fg-muted">
              {t('content.settings.media.file')}
            </div>
          ),
      },
      {
        key: 'name',
        title: t('content.settings.media.columns.name'),
        render: (_, record) => (
          <div className="min-w-0">
            <div className="font-medium text-fg">{record.originalName}</div>
            <div className="text-fg-muted mt-1 text-xs">{record.fileName}</div>
          </div>
        ),
      },
      {
        dataIndex: 'mimeType',
        key: 'mimeType',
        title: t('content.settings.media.columns.mimeType'),
        render: (value: string) => <Tag>{value}</Tag>,
      },
      {
        dataIndex: 'size',
        key: 'size',
        title: t('content.settings.media.columns.size'),
        render: (value: number) => formatBytes(value),
      },
      {
        key: 'url',
        title: t('content.settings.media.columns.url'),
        render: (_, record) => <div className="break-all text-xs text-fg-muted">{mediaUrl(record)}</div>,
      },
      {
        dataIndex: 'createdAt',
        key: 'createdAt',
        title: t('content.settings.media.columns.createdAt'),
        render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
      },
      {
        key: 'actions',
        title: t('common.actions'),
        width: 220,
        render: (_, record) => (
          <Space wrap>
            <Button
              type="link"
              size="small"
              icon={<Copy className="size-4" />}
              onClick={() => {
                void navigator.clipboard
                  .writeText(mediaUrl(record))
                  .then(() => message.success(t('content.settings.media.copySuccess')))
                  .catch(() => message.error(t('content.settings.media.copyFailed')))
              }}
            >
              {t('content.settings.media.copy')}
            </Button>
            <Button
              type="link"
              size="small"
              icon={<ExternalLink className="size-4" />}
              onClick={() => {
                window.open(mediaUrl(record), '_blank', 'noopener,noreferrer')
              }}
            >
              {t('content.settings.media.open')}
            </Button>
            <Popconfirm
              title={t('content.settings.media.deleteConfirmTitle')}
              description={t('content.settings.media.deleteConfirmDescription')}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
              onConfirm={() => void handleDeleteMedia(record.id)}
            >
              <Button danger type="link" size="small" icon={<Trash2 className="size-4" />}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [handleDeleteMedia, message, t],
  )

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

  const handleUploadFiles = async (files: File[]) => {
    if (files.length === 0) {
      return
    }

    let uploadedCount = 0
    let skippedCount = 0

    for (const file of files) {
      if (file.size > MAX_UPLOAD_SIZE) {
        skippedCount += 1
        message.error(t('content.settings.media.tooLarge'))
        continue
      }

      try {
        await uploadMediaMutation.mutateAsync(file)
        uploadedCount += 1
      } catch (error) {
        skippedCount += 1
        const errorMessage = error instanceof MediaRequestError ? error.message : t('common.error')
        message.error(errorMessage)
      }
    }

    if (uploadedCount > 0) {
      await refreshMediaList()
      message.success(t('content.settings.media.uploaded'))
    }

    if (skippedCount > 0 && uploadedCount === 0) {
      message.warning(t('content.settings.media.uploadSkipped'))
    }
  }

  const resetSiteConfigForm = () => {
    form.setFieldsValue(siteConfigFormValues)
    hydratedSiteConfigSnapshotRef.current = JSON.stringify(siteConfigFormValues)
    isEditingSiteConfigRef.current = false
  }

  return (
    <div className={ARTICLE_PAGE_CLASSNAME}>
      <section className="rounded-3xl border border-border-subtle bg-surface/72 px-4 py-4 shadow-sm backdrop-blur-xs">
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

      <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card
          className={ARTICLE_PANEL_CLASSNAME}
          styles={{ body: ARTICLE_PANEL_BODY_STYLE }}
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

        <Card
          className={ARTICLE_PANEL_CLASSNAME}
          styles={{ body: ARTICLE_PANEL_BODY_STYLE }}
          title={t('content.settings.media.title')}
          extra={
            <span className="text-fg-muted text-sm">
              {canReadMedia ? t('common.total', { count: mediaListQuery.data?.total ?? 0 }) : '-'}
            </span>
          }
        >
          {canReadMedia || canWriteMedia ? (
            <div className="flex flex-1 flex-col gap-4">
              <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-subtle/18 p-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="text-sm font-medium text-fg">{t('content.settings.media.uploadTitle')}</div>
                    <p className="text-fg-muted mt-1 text-sm">{t('content.settings.media.uploadHint')}</p>
                  </div>

                  <Space wrap>
                    <Button
                      disabled={!canWriteMedia}
                      icon={<Upload className="size-4" />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {t('content.settings.media.upload')}
                    </Button>
                    <Button icon={<RefreshCw className="size-4" />} onClick={() => void refreshMediaList()}>
                      {t('common.refresh')}
                    </Button>
                  </Space>
                  <input
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    type="file"
                    onChange={(event) => {
                      const files = Array.from(event.currentTarget.files ?? [])
                      event.currentTarget.value = ''
                      void handleUploadFiles(files)
                    }}
                  />
                </div>
              </div>

              <Table
                className={ARTICLE_TABLE_CLASSNAME}
                columns={columns}
                dataSource={mediaListQuery.data?.items}
                loading={canReadMedia && mediaListQuery.isLoading}
                locale={{
                  emptyText: (
                    <Empty description={t('content.settings.media.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ),
                }}
                pagination={{
                  current: page,
                  onChange: (nextPage, nextPageSize) => {
                    setPage(nextPage)
                    setPageSize(nextPageSize)
                  },
                  pageSize,
                  showQuickJumper: true,
                  showSizeChanger: true,
                  showTotal: (total) => t('common.total', { count: total }),
                  total: mediaListQuery.data?.total,
                }}
                rowKey="id"
                scroll={{ x: 920 }}
              />

              <Card size="small" className="rounded-2xl" title={t('content.settings.media.summaryTitle')}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={t('content.settings.media.summary.currentPage')}>
                    {mediaListQuery.data?.items.length ?? 0}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('content.settings.media.summary.limit')}>
                    {`${MAX_UPLOAD_SIZE / (1024 * 1024)} MB`}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('content.settings.media.summary.copy')}>
                    {t('content.settings.media.summary.copyHint')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </div>
          ) : (
            <Empty description={t('content.settings.media.unavailable')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </div>
    </div>
  )
}
