import { canAccessConsolePath, createPermissionKeySet } from '@console/app/access/access-control'
import { Markdown } from '@console/components/ui'
import {
  POST_DETAIL_QUERY_KEY,
  POST_LIST_QUERY_KEY,
  PostRequestError,
  useDeletePostMutation,
  usePostDetailQuery,
  usePublishPostMutation,
  useUnpublishPostMutation,
} from '@console/modules/post'
import { useCurrentUserPermissionsQuery } from '@console/modules/rbac'
import { useSettingStore } from '@console/stores/modules/setting'
import { getPrimaryColorByTheme } from '@console/utils/theme'

import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { App as AntdApp, Button, Card, Descriptions, Empty, Popconfirm, Space, Spin, Tag } from 'antd'
import { ArrowLeft, SquarePen, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { canUsePermission, formatDateTime, POST_PUBLISH_PERMISSION, renderPostStatus } from '../shared/content-utils'
import { ARTICLE_PAGE_CLASSNAME, ARTICLE_PANEL_BODY_STYLE, ARTICLE_PANEL_CLASSNAME } from '../shared/page-layout'

/**
 * 文章详情页。
 */
export function PostDetail() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { catppuccinTheme } = useSettingStore()
  const primaryColor = getPrimaryColorByTheme(catppuccinTheme)
  const { id } = useParams({ from: '/protected/app-layout/articles/$id' })

  const postQuery = usePostDetailQuery(id)
  const currentUserPermissionsQuery = useCurrentUserPermissionsQuery()
  const deletePostMutation = useDeletePostMutation()
  const publishPostMutation = usePublishPostMutation()
  const unpublishPostMutation = useUnpublishPostMutation()
  const permissionKeys = useMemo(
    () => createPermissionKeySet(currentUserPermissionsQuery.data?.permissions),
    [currentUserPermissionsQuery.data?.permissions],
  )

  const canEdit = canAccessConsolePath(`/articles/${id}/edit`, permissionKeys)
  const canPublish = canUsePermission(permissionKeys, POST_PUBLISH_PERMISSION)

  const refreshPostCaches = async (nextPost?: unknown) => {
    if (nextPost) {
      queryClient.setQueryData(POST_DETAIL_QUERY_KEY(id), nextPost)
    }

    await queryClient.invalidateQueries({ queryKey: POST_LIST_QUERY_KEY })
  }

  const handlePublishToggle = async () => {
    if (!postQuery.data) {
      return
    }

    try {
      const nextPost =
        postQuery.data.status === 'published'
          ? await unpublishPostMutation.mutateAsync(id)
          : await publishPostMutation.mutateAsync(id)

      await refreshPostCaches(nextPost)
      message.success(
        postQuery.data.status === 'published'
          ? t('content.post.messages.unpublishSuccess')
          : t('content.post.messages.publishSuccess'),
      )
    } catch (error) {
      const errorMessage = error instanceof PostRequestError ? error.message : t('common.error')
      message.error(errorMessage)
    }
  }

  const handleDelete = async () => {
    try {
      await deletePostMutation.mutateAsync(id)
      queryClient.removeQueries({ queryKey: POST_DETAIL_QUERY_KEY(id) })
      await queryClient.invalidateQueries({ queryKey: POST_LIST_QUERY_KEY })
      message.success(t('content.post.messages.deleteSuccess'))
      await navigate({ to: '/articles' })
    } catch (error) {
      const errorMessage = error instanceof PostRequestError ? error.message : t('common.error')
      message.error(errorMessage)
    }
  }

  if (postQuery.isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!postQuery.data) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Empty description={t('common.notFound')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  const post = postQuery.data
  const summaryItems = [
    { label: t('content.post.summary.slug'), value: post.slug },
    { label: t('content.post.fields.updatedAt'), value: formatDateTime(post.updatedAt) },
    { label: t('content.post.fields.publishedAt'), value: formatDateTime(post.publishedAt) },
  ]

  return (
    <div className={ARTICLE_PAGE_CLASSNAME}>
      <section className="rounded-2xl border border-border-subtle bg-surface/85 px-5 py-5 shadow-sm backdrop-blur-xs sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 max-w-3xl">
            <Button
              type="text"
              className="-ml-3 px-3"
              icon={<ArrowLeft className="size-4" />}
              onClick={() => void navigate({ to: '/articles' })}
            >
              {t('common.back')}
            </Button>
            <h1 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{post.title}</h1>
            <p className="text-fg-muted mt-2 max-w-2xl text-sm">{t('content.post.detail.description')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {renderPostStatus(post.status, t)}
              {post.category ? <Tag>{post.category}</Tag> : null}
              {post.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 xl:max-w-[44%] xl:items-end">
            <div className="flex flex-wrap gap-2 xl:justify-end">
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

            <Space wrap>
              {canPublish ? (
                <Button
                  onClick={() => void handlePublishToggle()}
                  loading={publishPostMutation.isPending || unpublishPostMutation.isPending}
                >
                  {post.status === 'published' ? t('common.unpublish') : t('common.publish')}
                </Button>
              ) : null}
              {canEdit ? (
                <Button
                  type="primary"
                  icon={<SquarePen className="size-4" />}
                  onClick={() => void navigate({ to: '/articles/$id/edit', params: { id } })}
                >
                  {t('common.edit')}
                </Button>
              ) : null}
              {canEdit ? (
                <Popconfirm
                  title={t('content.post.confirmDeleteTitle')}
                  description={t('content.post.confirmDeleteDescription')}
                  okText={t('common.confirm')}
                  cancelText={t('common.cancel')}
                  onConfirm={() => void handleDelete()}
                >
                  <Button danger icon={<Trash2 className="size-4" />} loading={deletePostMutation.isPending}>
                    {t('common.delete')}
                  </Button>
                </Popconfirm>
              ) : null}
            </Space>
          </div>
        </div>
      </section>

      <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
        <Card
          className={ARTICLE_PANEL_CLASSNAME}
          styles={{ body: ARTICLE_PANEL_BODY_STYLE }}
          title={t('content.post.detail.previewTitle')}
        >
          <div className="flex flex-1 flex-col">
            {post.excerpt ? (
              <div className="mb-4 rounded-2xl border border-border-subtle bg-surface-subtle/18 p-3">
                <div className="text-fg-muted text-xs">{t('content.post.fields.excerpt')}</div>
                <div className="mt-1 text-sm leading-6 text-fg">{post.excerpt}</div>
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-auto">
              <Markdown accentColor={primaryColor} catppuccinTheme={catppuccinTheme} value={post.markdown} />
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card className="rounded-2xl" title={t('content.post.detail.metaTitle')}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t('content.post.fields.slug')}>{post.slug}</Descriptions.Item>
              <Descriptions.Item label={t('content.post.fields.category')}>{post.category || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('content.post.fields.coverImage')}>
                {post.coverImage ? (
                  <a href={post.coverImage} target="_blank" rel="noreferrer" className="text-primary">
                    {post.coverImage}
                  </a>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label={t('content.post.fields.excerpt')}>{post.excerpt || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('content.post.fields.createdAt')}>
                {formatDateTime(post.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('content.post.fields.updatedAt')}>
                {formatDateTime(post.updatedAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('content.post.fields.publishedAt')}>
                {formatDateTime(post.publishedAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card className="rounded-2xl" title={t('content.post.detail.markdownTitle')}>
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-surface-subtle/20 p-3 text-xs text-fg-muted">
              {post.markdown}
            </pre>
          </Card>

          {post.coverImage ? (
            <Card className="rounded-2xl" title={t('content.post.detail.coverTitle')}>
              <div className="overflow-hidden rounded-2xl border border-border-subtle">
                <img src={post.coverImage} alt={post.title} className="h-48 w-full object-cover" />
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
