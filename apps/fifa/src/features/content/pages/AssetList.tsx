import type { ImageAsset } from '@xdd-zone/contracts'
import type { TableProps } from 'antd'

import { useAssetsQuery, useDeleteAssetMutation, useUpdateAssetMutation } from '@fifa/api/assets'
import { FifaPageHeader } from '@fifa/components/common'
import { useNavigate } from '@tanstack/react-router'
import { App, Button, Input, Modal, Select, Table, Tag } from 'antd'
import { Copy, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

const pageSize = 24

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function resolveAssetUrl(asset: ImageAsset) {
  return asset.fileUrl
}

export function AssetList() {
  const { t } = useTranslation()
  const { message, modal } = App.useApp()
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [mimeType, setMimeType] = useState('')
  const [page, setPage] = useState(1)
  const [editAsset, setEditAsset] = useState<ImageAsset | null>(null)
  const [editAlt, setEditAlt] = useState('')
  const query = useAssetsQuery({ keyword, mimeType: mimeType || undefined, page, pageSize })

  const mimeOptions = useMemo(
    () => [
      { label: t('content.assets.allTypes'), value: '' },
      { label: 'PNG', value: 'image/png' },
      { label: 'JPEG', value: 'image/jpeg' },
      { label: 'WEBP', value: 'image/webp' },
      { label: 'GIF', value: 'image/gif' },
      { label: 'AVIF', value: 'image/avif' },
    ],
    [t],
  )
  const deleteAssetMutation = useDeleteAssetMutation()
  const updateAssetMutation = useUpdateAssetMutation()

  const assetsResponse = query.data?.ok ? query.data.data : undefined
  const loadError = query.data && !query.data.ok ? query.data.error.message : undefined
  const assets = assetsResponse?.assets ?? []
  const total = assetsResponse?.total ?? 0

  const summaryItems = useMemo(
    () => [
      { label: t('content.assets.summary.totalAssets'), value: total },
      { label: t('content.assets.summary.currentPage'), value: assets.length },
    ],
    [assets.length, t, total],
  )

  const copyText = useCallback(
    async (text: string, successMessage: string) => {
      await navigator.clipboard.writeText(text)
      message.success(successMessage)
    },
    [message],
  )

  const handleDelete = useCallback(
    (asset: ImageAsset) => {
      modal.confirm({
        title: t('content.assets.deleteConfirmTitle'),
        content: t('content.assets.deleteConfirmMessage', { fileName: asset.fileName }),
        okText: t('content.assets.delete'),
        okButtonProps: { danger: true },
        cancelText: t('content.assets.cancel'),
        onOk: async () => {
          const response = await deleteAssetMutation.mutateAsync(asset.id)

          if (!response.ok) {
            message.error(response.error.message)
            return
          }

          message.success(t('content.assets.deleteSuccess'))
          await query.refetch()
        },
      })
    },
    [deleteAssetMutation, message, modal, query, t],
  )

  const columns = useMemo<TableProps<ImageAsset>['columns']>(
    () => [
      {
        dataIndex: 'fileName',
        title: t('content.assets.table.fileName'),
        width: 280,
        render: (_value: string, asset) => (
          <div className="flex items-center gap-3">
            <div className="size-12 overflow-hidden rounded-lg border border-border-subtle bg-surface-subtle">
              <img
                alt={asset.alt ?? asset.fileName}
                className="h-full w-full object-cover"
                src={resolveAssetUrl(asset)}
              />
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium text-fg">{asset.fileName}</div>
              <div className="mt-1 truncate text-xs text-fg-muted">{asset.id}</div>
            </div>
          </div>
        ),
      },
      {
        dataIndex: 'alt',
        title: t('content.assets.table.alt'),
        render: (alt: string | null) => alt ?? '-',
      },
      {
        dataIndex: 'mimeType',
        title: t('content.assets.table.mimeType'),
        width: 140,
        render: (value: string) => <Tag>{value}</Tag>,
      },
      {
        dataIndex: 'size',
        title: t('content.assets.table.size'),
        width: 120,
        render: (size: number) => formatSize(size),
      },
      {
        dataIndex: 'createdAt',
        title: t('content.assets.table.createdAt'),
        width: 180,
        render: formatDateTime,
      },
      {
        key: 'actions',
        title: t('content.assets.table.actions'),
        width: 260,
        render: (_, asset) => (
          <div className="flex flex-wrap gap-2">
            <Button
              size="small"
              onClick={() => void copyText(resolveAssetUrl(asset), t('content.assets.copyAddressSuccess'))}
              icon={<Copy className="size-4" />}
            >
              {t('content.assets.copyAddress')}
            </Button>
            <Button
              size="small"
              onClick={() => {
                setEditAsset(asset)
                setEditAlt(asset.alt ?? '')
              }}
              icon={<Pencil className="size-4" />}
            >
              {t('content.assets.edit')}
            </Button>
            <Button danger size="small" onClick={() => handleDelete(asset)} icon={<Trash2 className="size-4" />}>
              {t('content.assets.delete')}
            </Button>
          </div>
        ),
      },
    ],
    [copyText, handleDelete, t],
  )

  return (
    <div className="space-y-5">
      <FifaPageHeader
        title={t('content.assets.title')}
        description={t('content.assets.description')}
        actions={
          <>
            <Button
              icon={<RefreshCw className="size-4" />}
              loading={query.isFetching}
              onClick={() => void query.refetch()}
            >
              {t('content.assets.refresh')}
            </Button>
            <Button onClick={() => void navigate({ to: '/content/posts' as never })}>
              {t('content.assets.goBackPosts')}
            </Button>
          </>
        }
        summaryItems={summaryItems}
      />

      <section className="rounded-lg border border-border-subtle bg-surface">
        <div className="grid gap-3 border-b border-border-subtle px-4 py-4 md:grid-cols-[minmax(240px,1fr)_180px]">
          <Input
            allowClear
            prefix={<Search className="size-4 text-fg-muted" />}
            onChange={(event) => {
              setPage(1)
              setKeyword(event.target.value)
            }}
            placeholder={t('content.assets.searchPlaceholder')}
            value={keyword}
          />
          <Select
            options={mimeOptions}
            onChange={(value) => {
              setPage(1)
              setMimeType(value)
            }}
            value={mimeType}
          />
        </div>

        {loadError ? (
          <div className="border-b border-border-subtle px-4 py-3 text-sm text-danger">{loadError}</div>
        ) : null}

        <Table<ImageAsset>
          columns={columns}
          dataSource={assets}
          loading={query.isLoading}
          locale={{ emptyText: t('content.assets.emptyText') }}
          pagination={{ current: page, onChange: setPage, pageSize, showSizeChanger: false, total }}
          rowKey="id"
        />
      </section>

      <Modal
        destroyOnHidden
        okText={t('content.assets.save')}
        onCancel={() => {
          setEditAsset(null)
          setEditAlt('')
        }}
        onOk={async () => {
          if (!editAsset) {
            return
          }

          const response = await updateAssetMutation.mutateAsync({
            id: editAsset.id,
            payload: { alt: editAlt.trim() ? editAlt.trim() : null },
          })

          if (!response.ok) {
            message.error(response.error.message)
            return
          }

          message.success(t('content.assets.saveAltSuccess'))
          setEditAsset(null)
          setEditAlt('')
          await query.refetch()
        }}
        open={editAsset !== null}
        title={t('content.assets.editAlt')}
      >
        <Input
          onChange={(event) => setEditAlt(event.target.value)}
          placeholder={t('content.assets.editAltPlaceholder')}
          value={editAlt}
        />
      </Modal>
    </div>
  )
}
