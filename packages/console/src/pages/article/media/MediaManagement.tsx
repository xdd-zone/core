import type { Media } from '@console/modules/media'
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
import { resolveApiUrl } from '@console/shared/api'
import { useQueryClient } from '@tanstack/react-query'

import { Permissions } from '@xdd-zone/nexus/permissions'
import { App as AntdApp, Button, Card, Descriptions, Empty, Popconfirm, Space, Table, Tag } from 'antd'
import dayjs from 'dayjs'
import { Copy, ExternalLink, RefreshCw, Trash2, Upload } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { canUsePermission } from '../shared/content-utils'
import { ARTICLE_PAGE_CLASSNAME } from '../shared/page-layout'

const MEDIA_PAGE_SIZE = 12
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024
const ALLOWED_MEDIA_MIME_TYPES = new Set(['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'])

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

function isAllowedUploadFile(file: File) {
  return ALLOWED_MEDIA_MIME_TYPES.has(file.type)
}

function mediaUrl(media: Media) {
  return resolveApiUrl(media.url)
}

/**
 * 媒体资源管理页面。
 */
export function MediaManagement() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(MEDIA_PAGE_SIZE)

  const currentUserPermissionsQuery = useCurrentUserPermissionsQuery()
  const permissionKeys = createPermissionKeySet(currentUserPermissionsQuery.data?.permissions)
  const canReadMedia = canUsePermission(permissionKeys, Permissions.MEDIA.READ_ALL)
  const canWriteMedia = canUsePermission(permissionKeys, Permissions.MEDIA.WRITE_ALL)

  const mediaListQuery = useMediaListQuery({ page, pageSize }, canReadMedia)
  const uploadMediaMutation = useUploadMediaMutation()
  const deleteMediaMutation = useDeleteMediaMutation()

  const refreshMediaList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: MEDIA_LIST_QUERY_KEY })
  }, [queryClient])

  const handleDeleteMedia = useCallback(
    async (id: string) => {
      try {
        await deleteMediaMutation.mutateAsync(id)
        await refreshMediaList()
        message.success(t('content.media.deleted'))
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
        title: t('content.media.columns.preview'),
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
              {t('content.media.file')}
            </div>
          ),
      },
      {
        key: 'name',
        title: t('content.media.columns.name'),
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
        title: t('content.media.columns.mimeType'),
        render: (value: string) => <Tag>{value}</Tag>,
      },
      {
        dataIndex: 'size',
        key: 'size',
        title: t('content.media.columns.size'),
        render: (value: number) => formatBytes(value),
      },
      {
        key: 'url',
        title: t('content.media.columns.url'),
        render: (_, record) => <div className="break-all text-xs text-fg-muted">{mediaUrl(record)}</div>,
      },
      {
        dataIndex: 'createdAt',
        key: 'createdAt',
        title: t('content.media.columns.createdAt'),
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
                  .then(() => message.success(t('content.media.copySuccess')))
                  .catch(() => message.error(t('content.media.copyFailed')))
              }}
            >
              {t('content.media.copy')}
            </Button>
            <Button
              type="link"
              size="small"
              icon={<ExternalLink className="size-4" />}
              onClick={() => {
                window.open(mediaUrl(record), '_blank', 'noopener,noreferrer')
              }}
            >
              {t('content.media.open')}
            </Button>
            <Popconfirm
              title={t('content.media.deleteConfirmTitle')}
              description={t('content.media.deleteConfirmDescription')}
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

  const handleUploadFiles = async (files: File[]) => {
    if (files.length === 0) {
      return
    }

    let uploadedCount = 0
    let skippedCount = 0

    for (const file of files) {
      if (!isAllowedUploadFile(file)) {
        skippedCount += 1
        message.error(t('content.media.unsupportedType'))
        continue
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        skippedCount += 1
        message.error(t('content.media.tooLarge'))
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
      message.success(t('content.media.uploaded'))
    }

    if (skippedCount > 0 && uploadedCount === 0) {
      message.warning(t('content.media.uploadSkipped'))
    }
  }

  return (
    <div className={ARTICLE_PAGE_CLASSNAME}>
      <section className="rounded-2xl border border-border-subtle bg-surface/72 px-4 py-4 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 max-w-2xl">
            <h1 className="text-fg text-xl font-semibold tracking-tight">{t('content.media.pageTitle')}</h1>
            <p className="text-fg-muted mt-1.5 text-sm">{t('content.media.pageDescription')}</p>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-[44%] xl:justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-overlay-0/16 px-2.5 py-1 text-xs">
              <span className="text-fg-muted">{t('content.media.summary.total')}</span>
              <span className="font-medium text-fg">
                {canReadMedia ? String(mediaListQuery.data?.total ?? 0) : '-'}
              </span>
            </span>
          </div>
        </div>
      </section>

      <Card
        className="overflow-hidden rounded-2xl"
        title={t('content.media.title')}
        extra={
          <span className="text-fg-muted text-sm">
            {canReadMedia ? t('common.total', { count: mediaListQuery.data?.total ?? 0 }) : '-'}
          </span>
        }
      >
        {canReadMedia || canWriteMedia ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-subtle/18 p-4">
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-sm font-medium text-fg">{t('content.media.uploadTitle')}</div>
                  <p className="text-fg-muted mt-1 text-sm">{t('content.media.uploadHint')}</p>
                </div>

                <Space wrap>
                  <Button
                    disabled={!canWriteMedia}
                    icon={<Upload className="size-4" />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t('content.media.upload')}
                  </Button>
                  <Button icon={<RefreshCw className="size-4" />} onClick={() => void refreshMediaList()}>
                    {t('common.refresh')}
                  </Button>
                </Space>
                <input
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
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
              columns={columns}
              dataSource={mediaListQuery.data?.items}
              loading={canReadMedia && mediaListQuery.isLoading}
              locale={{
                emptyText: <Empty description={t('content.media.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
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

            <Card size="small" className="rounded-2xl" title={t('content.media.summaryTitle')}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label={t('content.media.summary.currentPage')}>
                  {mediaListQuery.data?.items.length ?? 0}
                </Descriptions.Item>
                <Descriptions.Item label={t('content.media.summary.limit')}>
                  {`${MAX_UPLOAD_SIZE / (1024 * 1024)} MB`}
                </Descriptions.Item>
                <Descriptions.Item label={t('content.media.summary.copy')}>
                  {t('content.media.summary.copyHint')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        ) : (
          <Empty description={t('content.media.unavailable')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  )
}
