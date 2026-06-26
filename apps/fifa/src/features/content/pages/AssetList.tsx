import type { ImageAsset } from '@xdd-zone/contracts'
import type { TableProps } from 'antd'

import { useContentAssetsQuery, useDeleteContentAssetMutation, useUpdateContentAssetMutation } from '@fifa/api/content'
import { resolveMomoHttpUrl } from '@fifa/api/momo-url'
import { FifaPageHeader } from '@fifa/components/common'
import { useNavigate } from '@tanstack/react-router'
import { App, Button, Input, Modal, Select, Table, Tag } from 'antd'
import { Copy, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

const pageSize = 24

const mimeOptions = [
  { label: '全部类型', value: '' },
  { label: 'PNG', value: 'image/png' },
  { label: 'JPEG', value: 'image/jpeg' },
  { label: 'WEBP', value: 'image/webp' },
  { label: 'GIF', value: 'image/gif' },
  { label: 'AVIF', value: 'image/avif' },
]

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
  return asset.url ?? resolveMomoHttpUrl(`/rpc/content/assets/${asset.id}/file`).toString()
}

export function AssetList() {
  const { message, modal } = App.useApp()
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [mimeType, setMimeType] = useState('')
  const [page, setPage] = useState(1)
  const [editAsset, setEditAsset] = useState<ImageAsset | null>(null)
  const [editAlt, setEditAlt] = useState('')
  const query = useContentAssetsQuery({ keyword, mimeType: mimeType || undefined, page, pageSize })
  const deleteAssetMutation = useDeleteContentAssetMutation()
  const updateAssetMutation = useUpdateContentAssetMutation()

  const assetsResponse = query.data?.ok ? query.data.data : undefined
  const loadError = query.data && !query.data.ok ? query.data.error.message : undefined
  const assets = assetsResponse?.assets ?? []
  const total = assetsResponse?.total ?? 0

  const summaryItems = useMemo(
    () => [
      { label: '素材', value: total },
      { label: '当前页', value: assets.length },
    ],
    [assets.length, total],
  )

  const copyText = useCallback(async (text: string, successMessage: string) => {
    await navigator.clipboard.writeText(text)
    message.success(successMessage)
  }, [message])

  const handleDelete = useCallback(
    (asset: ImageAsset) => {
      modal.confirm({
        title: '删除素材',
        content: `确认删除 ${asset.fileName}。删除后文件会一起移除，引用它的文章需要先改掉。`,
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          const response = await deleteAssetMutation.mutateAsync(asset.id)

          if (!response.ok) {
            message.error(response.error.message)
            return
          }

          message.success('素材已删除')
          await query.refetch()
        },
      })
    },
    [deleteAssetMutation, message, modal, query],
  )

  const columns = useMemo<TableProps<ImageAsset>['columns']>(
    () => [
      {
        dataIndex: 'fileName',
        title: '文件',
        width: 280,
        render: (_value: string, asset) => (
          <div className="flex items-center gap-3">
            <div className="size-12 overflow-hidden rounded-lg border border-border-subtle bg-surface-subtle">
              <img alt={asset.alt ?? asset.fileName} className="h-full w-full object-cover" src={resolveAssetUrl(asset)} />
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
        title: '说明',
        render: (alt: string | null) => alt ?? '-',
      },
      {
        dataIndex: 'mimeType',
        title: '类型',
        width: 140,
        render: (value: string) => <Tag>{value}</Tag>,
      },
      {
        dataIndex: 'size',
        title: '大小',
        width: 120,
        render: (size: number) => formatSize(size),
      },
      {
        dataIndex: 'createdAt',
        title: '上传时间',
        width: 180,
        render: formatDateTime,
      },
      {
        key: 'actions',
        title: '操作',
        width: 260,
        render: (_, asset) => (
          <div className="flex flex-wrap gap-2">
            <Button size="small" onClick={() => void copyText(resolveAssetUrl(asset), '图片地址已复制')} icon={<Copy className="size-4" />}>
              复制地址
            </Button>
            <Button
              size="small"
              onClick={() => {
                setEditAsset(asset)
                setEditAlt(asset.alt ?? '')
              }}
              icon={<Pencil className="size-4" />}
            >
              编辑
            </Button>
            <Button danger size="small" onClick={() => handleDelete(asset)} icon={<Trash2 className="size-4" />}>
              删除
            </Button>
          </div>
        ),
      },
    ],
    [copyText, handleDelete],
  )

  return (
    <div className="space-y-5">
      <FifaPageHeader
        title="媒体库"
        description="管理已经上传的图片素材。"
        actions={
          <>
            <Button icon={<RefreshCw className="size-4" />} loading={query.isFetching} onClick={() => void query.refetch()}>
              刷新
            </Button>
            <Button onClick={() => void navigate({ to: '/content/posts' as never })}>回到文章</Button>
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
            placeholder="搜索文件名、说明或路径"
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

        {loadError ? <div className="border-b border-border-subtle px-4 py-3 text-sm text-danger">{loadError}</div> : null}

        <Table<ImageAsset>
          columns={columns}
          dataSource={assets}
          loading={query.isLoading}
          locale={{ emptyText: '暂无素材' }}
          pagination={{ current: page, onChange: setPage, pageSize, showSizeChanger: false, total }}
          rowKey="id"
        />
      </section>

      <Modal
        destroyOnHidden
        okText="保存"
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

          message.success('说明已保存')
          setEditAsset(null)
          setEditAlt('')
          await query.refetch()
        }}
        open={editAsset !== null}
        title="编辑素材说明"
      >
        <Input onChange={(event) => setEditAlt(event.target.value)} placeholder="输入素材说明" value={editAlt} />
      </Modal>
    </div>
  )
}
