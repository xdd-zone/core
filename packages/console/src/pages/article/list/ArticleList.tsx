import type { Post } from '@console/modules/post'
import type { TableProps } from 'antd'

import { canAccessConsolePath, createPermissionKeySet } from '@console/app/access/access-control'
import {
  POST_DETAIL_QUERY_KEY,
  POST_LIST_QUERY_KEY,
  PostRequestError,
  useDeletePostMutation,
  usePostListQuery,
  usePublishPostMutation,
  useUnpublishPostMutation,
} from '@console/modules/post'
import { useCurrentUserPermissionsQuery } from '@console/modules/rbac'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { App as AntdApp, Button, Card, Input, Popconfirm, Select, Space, Table, Tag } from 'antd'
import { FilePlus2, RefreshCw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  canUsePermission,
  formatDateTime,
  POST_PUBLISH_PERMISSION,
  POST_STATUS_OPTIONS,
  renderPostStatus,
} from '../shared/content-utils'

/**
 * 文章列表页面。
 */
export function ArticleList() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [status, setStatus] = useState<'' | 'draft' | 'published'>('')
  const [category, setCategory] = useState('')
  const [tag, setTag] = useState('')

  const currentUserPermissionsQuery = useCurrentUserPermissionsQuery()
  const publishPostMutation = usePublishPostMutation()
  const unpublishPostMutation = useUnpublishPostMutation()
  const deletePostMutation = useDeletePostMutation()
  const permissionKeys = useMemo(
    () => createPermissionKeySet(currentUserPermissionsQuery.data?.permissions),
    [currentUserPermissionsQuery.data?.permissions],
  )

  const postListQuery = usePostListQuery({
    category: category || undefined,
    keyword: keyword || undefined,
    page,
    pageSize,
    status: status || undefined,
    tag: tag || undefined,
  })

  const currentItems = postListQuery.data?.items ?? []
  const canCreate = canAccessConsolePath('/articles/new', permissionKeys)
  const canPublish = canUsePermission(permissionKeys, POST_PUBLISH_PERMISSION)

  const handlePublishToggle = async (record: Post) => {
    try {
      const nextPost =
        record.status === 'published'
          ? await unpublishPostMutation.mutateAsync(record.id)
          : await publishPostMutation.mutateAsync(record.id)

      queryClient.setQueryData(POST_DETAIL_QUERY_KEY(record.id), nextPost)
      await queryClient.invalidateQueries({ queryKey: POST_LIST_QUERY_KEY })
      message.success(
        record.status === 'published'
          ? t('content.post.messages.unpublishSuccess')
          : t('content.post.messages.publishSuccess'),
      )
    } catch (error) {
      const errorMessage = error instanceof PostRequestError ? error.message : t('common.error')
      message.error(errorMessage)
    }
  }

  const handleDelete = async (record: Post) => {
    try {
      await deletePostMutation.mutateAsync(record.id)
      queryClient.removeQueries({ queryKey: POST_DETAIL_QUERY_KEY(record.id) })
      await queryClient.invalidateQueries({ queryKey: POST_LIST_QUERY_KEY })
      message.success(t('content.post.messages.deleteSuccess'))
    } catch (error) {
      const errorMessage = error instanceof PostRequestError ? error.message : t('common.error')
      message.error(errorMessage)
    }
  }

  const summaryItems = [
    { label: t('content.post.summary.total'), value: postListQuery.data?.total ?? 0 },
    {
      label: t('content.post.summary.published'),
      value: currentItems.filter((item) => item.status === 'published').length,
    },
    {
      label: t('content.post.summary.draft'),
      value: currentItems.filter((item) => item.status === 'draft').length,
    },
  ]

  const columns: TableProps<Post>['columns'] = [
    {
      dataIndex: 'title',
      key: 'title',
      title: t('content.post.fields.title'),
      render: (_, record) => (
        <div className="min-w-0">
          <button
            type="button"
            className="text-left text-sm font-medium text-fg transition-colors hover:text-primary"
            onClick={() => void navigate({ to: '/articles/$id', params: { id: record.id } })}
          >
            {record.title}
          </button>
          <div className="text-fg-muted mt-1 text-xs">{record.slug}</div>
        </div>
      ),
    },
    {
      dataIndex: 'status',
      key: 'status',
      title: t('content.post.fields.status'),
      render: (value) => renderPostStatus(value, t),
    },
    {
      dataIndex: 'category',
      key: 'category',
      title: t('content.post.fields.category'),
      render: (value: string | null) => value || '-',
    },
    {
      dataIndex: 'tags',
      key: 'tags',
      title: t('content.post.fields.tags'),
      render: (value: string[]) =>
        value.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 3).map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
            {value.length > 3 ? <Tag>+{value.length - 3}</Tag> : null}
          </div>
        ) : (
          '-'
        ),
    },
    {
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      title: t('content.post.fields.updatedAt'),
      render: (value) => formatDateTime(value),
    },
    {
      key: 'actions',
      title: t('common.actions'),
      width: 280,
      render: (_, record) => (
        <Space wrap size="small">
          <Button
            type="link"
            size="small"
            onClick={() => void navigate({ to: '/articles/$id', params: { id: record.id } })}
          >
            {t('common.view')}
          </Button>
          {canAccessConsolePath(`/articles/${record.id}/edit`, permissionKeys) ? (
            <Button
              type="link"
              size="small"
              onClick={() => void navigate({ to: '/articles/$id/edit', params: { id: record.id } })}
            >
              {t('common.edit')}
            </Button>
          ) : null}
          {canPublish ? (
            <Button type="link" size="small" onClick={() => void handlePublishToggle(record)}>
              {record.status === 'published' ? t('common.unpublish') : t('common.publish')}
            </Button>
          ) : null}
          {canAccessConsolePath(`/articles/${record.id}/edit`, permissionKeys) ? (
            <Popconfirm
              title={t('content.post.confirmDeleteTitle')}
              description={t('content.post.confirmDeleteDescription')}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
              onConfirm={() => void handleDelete(record)}
            >
              <Button type="link" danger size="small">
                {t('common.delete')}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl border border-border-subtle bg-surface/72 px-4 py-4 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 max-w-2xl">
            <h1 className="text-fg text-xl font-semibold tracking-tight">{t('menu.articleList')}</h1>
            <p className="text-fg-muted mt-1.5 text-sm">{t('content.post.list.description')}</p>
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
        title={t('content.post.list.resultsTitle')}
        extra={
          <Space>
            {canCreate ? (
              <Button
                type="primary"
                icon={<FilePlus2 className="size-4" />}
                onClick={() => void navigate({ to: '/articles/new' })}
              >
                {t('content.post.actions.create')}
              </Button>
            ) : null}
            <span className="text-fg-muted text-sm">
              {t('common.total', { count: postListQuery.data?.total ?? 0 })}
            </span>
          </Space>
        }
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <Input
              allowClear
              className="min-w-0 lg:w-80"
              placeholder={t('content.post.list.keywordPlaceholder')}
              prefix={<Search className="text-fg-muted size-4" />}
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value)
                setPage(1)
              }}
            />
            <Select
              className="w-full lg:w-44"
              options={POST_STATUS_OPTIONS.map((item) => ({ label: t(item.label), value: item.value }))}
              value={status}
              onChange={(value) => {
                setStatus(value)
                setPage(1)
              }}
            />
            <Input
              allowClear
              className="w-full lg:w-44"
              placeholder={t('content.post.list.categoryPlaceholder')}
              value={category}
              onChange={(event) => {
                setCategory(event.target.value)
                setPage(1)
              }}
            />
            <Input
              allowClear
              className="w-full lg:w-44"
              placeholder={t('content.post.list.tagPlaceholder')}
              value={tag}
              onChange={(event) => {
                setTag(event.target.value)
                setPage(1)
              }}
            />
          </div>

          <Button
            icon={<RefreshCw className="size-4" />}
            onClick={() => {
              setKeyword('')
              setStatus('')
              setCategory('')
              setTag('')
              setPage(1)
              setPageSize(20)
            }}
          >
            {t('common.reset')}
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={postListQuery.data?.items}
          loading={postListQuery.isLoading}
          rowKey="id"
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
            total: postListQuery.data?.total,
          }}
        />
      </Card>
    </div>
  )
}
