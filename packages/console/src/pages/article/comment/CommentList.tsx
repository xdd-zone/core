import type { Comment, CommentListQuery } from '@console/modules/comment'
import type { TableProps } from 'antd'
import type { Dayjs } from 'dayjs'

import {
  COMMENT_DETAIL_QUERY_KEY,
  COMMENT_LIST_QUERY_KEY,
  CommentRequestError,
  useCommentDetailQuery,
  useCommentListQuery,
  useDeleteCommentMutation,
  useUpdateCommentStatusMutation,
} from '@console/modules/comment'
import { usePostListQuery } from '@console/modules/post'

import { useQueryClient } from '@tanstack/react-query'
import {
  App as AntdApp,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Typography,
} from 'antd'
import { Eye, FilterX, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  COMMENT_REVIEW_OPTIONS,
  COMMENT_STATUS_OPTIONS,
  formatDateTime,
  renderCommentStatus,
} from '../shared/content-utils'
import {
  ARTICLE_PAGE_CLASSNAME,
  ARTICLE_PANEL_BODY_STYLE,
  ARTICLE_PANEL_CLASSNAME,
  ARTICLE_TABLE_CLASSNAME,
} from '../shared/page-layout'

const { Paragraph, Text } = Typography
const { RangePicker } = DatePicker

type EditableCommentStatus = Exclude<Comment['status'], 'deleted'>

function trimOptional(value?: string) {
  return value?.trim() || undefined
}

/**
 * 评论管理页面。
 */
export function CommentList() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()

  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<CommentListQuery['status']>()
  const [postId, setPostId] = useState<string>()
  const [createdRange, setCreatedRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedCommentId, setSelectedCommentId] = useState<string>()
  const [selectedComment, setSelectedComment] = useState<Comment | undefined>()
  const [editableStatus, setEditableStatus] = useState<EditableCommentStatus | undefined>()

  const postListQuery = usePostListQuery({ page: 1, pageSize: 100 })
  const commentListQuery = useCommentListQuery({
    createdFrom: createdRange?.[0]?.toISOString(),
    createdTo: createdRange?.[1]?.toISOString(),
    keyword: trimOptional(keyword),
    page,
    pageSize,
    postId,
    status,
  })
  const commentDetailQuery = useCommentDetailQuery(selectedCommentId ?? '', drawerOpen && Boolean(selectedCommentId))
  const updateCommentStatusMutation = useUpdateCommentStatusMutation()
  const deleteCommentMutation = useDeleteCommentMutation()

  const postOptions = useMemo(
    () =>
      (postListQuery.data?.items ?? []).map((post) => ({
        label: `${post.title} · ${post.slug}`,
        value: post.id,
      })),
    [postListQuery.data?.items],
  )

  const postTitleMap = useMemo(
    () => new Map((postListQuery.data?.items ?? []).map((post) => [post.id, post])),
    [postListQuery.data?.items],
  )

  const currentItems = commentListQuery.data?.items ?? []
  const summaryItems = [
    { label: t('content.comment.summary.total'), value: String(commentListQuery.data?.total ?? 0) },
    { label: t('content.comment.summary.page'), value: String(currentItems.length) },
    {
      label: t('content.comment.summary.filter'),
      value: status || postId || keyword ? t('content.comment.summary.filtered') : t('common.all'),
    },
  ]

  const openDetail = useCallback((comment: Comment) => {
    setSelectedCommentId(comment.id)
    setSelectedComment(comment)
    setEditableStatus(comment.status === 'deleted' ? undefined : comment.status)
    setDrawerOpen(true)
  }, [])

  const resetFilters = () => {
    setKeyword('')
    setStatus(undefined)
    setPostId(undefined)
    setCreatedRange(null)
    setPage(1)
    setPageSize(20)
  }

  const refreshComments = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: COMMENT_LIST_QUERY_KEY })
  }, [queryClient])

  const handleUpdateStatus = useCallback(async () => {
    if (!selectedCommentId || !editableStatus) {
      message.warning(t('content.comment.messages.statusRequired'))
      return
    }

    try {
      const updatedComment = await updateCommentStatusMutation.mutateAsync({
        id: selectedCommentId,
        status: editableStatus,
      })
      queryClient.setQueryData(COMMENT_DETAIL_QUERY_KEY(selectedCommentId), updatedComment)
      await refreshComments()
      setSelectedComment(updatedComment)
      setEditableStatus(updatedComment.status === 'deleted' ? undefined : updatedComment.status)
      message.success(t('content.comment.messages.statusUpdated'))
    } catch (error) {
      const errorMessage = error instanceof CommentRequestError ? error.message : t('common.error')
      message.error(errorMessage)
    }
  }, [editableStatus, message, queryClient, refreshComments, selectedCommentId, t, updateCommentStatusMutation])

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      try {
        await deleteCommentMutation.mutateAsync(commentId)
        await refreshComments()
        await queryClient.invalidateQueries({ queryKey: COMMENT_DETAIL_QUERY_KEY(commentId) })

        if (selectedCommentId === commentId) {
          setDrawerOpen(false)
          setSelectedCommentId(undefined)
          setSelectedComment(undefined)
        }

        message.success(t('content.comment.messages.deleted'))
      } catch (error) {
        const errorMessage = error instanceof CommentRequestError ? error.message : t('common.error')
        message.error(errorMessage)
      }
    },
    [deleteCommentMutation, message, queryClient, refreshComments, selectedCommentId, t],
  )

  const columns = useMemo<TableProps<Comment>['columns']>(
    () => [
      {
        dataIndex: 'content',
        key: 'content',
        title: t('content.comment.columns.content'),
        render: (value: string) => (
          <div className="max-w-[36rem]">
            <Paragraph className="mb-0 text-fg" ellipsis={{ rows: 2 }}>
              {value}
            </Paragraph>
          </div>
        ),
      },
      {
        key: 'author',
        title: t('content.comment.columns.author'),
        render: (_, record) => (
          <div className="min-w-0">
            <div className="font-medium text-fg">{record.authorName}</div>
            <div className="text-fg-muted mt-1 text-xs">{record.authorEmail || t('content.comment.value.none')}</div>
          </div>
        ),
      },
      {
        key: 'post',
        title: t('content.comment.columns.post'),
        render: (_, record) => {
          const post = postTitleMap.get(record.postId)

          return (
            <div className="min-w-0">
              <div className="font-medium text-fg">{post?.title || record.postId}</div>
              <div className="text-fg-muted mt-1 text-xs">{post?.slug || t('content.comment.value.unknown')}</div>
            </div>
          )
        },
      },
      {
        dataIndex: 'status',
        key: 'status',
        title: t('content.comment.columns.status'),
        render: (value: Comment['status']) => renderCommentStatus(value, t),
      },
      {
        dataIndex: 'createdAt',
        key: 'createdAt',
        title: t('content.comment.columns.createdAt'),
        render: (value: string) => formatDateTime(value),
      },
      {
        key: 'actions',
        title: t('common.actions'),
        width: 180,
        render: (_, record) => (
          <Space>
            <Button type="link" size="small" icon={<Eye className="size-4" />} onClick={() => openDetail(record)}>
              {t('common.view')}
            </Button>
            <Popconfirm
              title={t('content.comment.deleteConfirmTitle')}
              description={t('content.comment.deleteConfirmDescription')}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
              onConfirm={() => void handleDeleteComment(record.id)}
            >
              <Button type="link" danger size="small" icon={<Trash2 className="size-4" />}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [handleDeleteComment, openDetail, postTitleMap, t],
  )

  const detailComment = commentDetailQuery.data ?? selectedComment
  const canEditStatus = detailComment?.status !== 'deleted'

  return (
    <div className={ARTICLE_PAGE_CLASSNAME}>
      <section className="rounded-2xl border border-border-subtle bg-surface/72 px-4 py-4 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 max-w-2xl">
            <h1 className="text-fg text-xl font-semibold tracking-tight">{t('content.comment.title')}</h1>
            <p className="text-fg-muted mt-1.5 text-sm">{t('content.comment.description')}</p>
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
        className={ARTICLE_PANEL_CLASSNAME}
        styles={{ body: ARTICLE_PANEL_BODY_STYLE }}
        title={t('content.comment.title')}
        extra={
          <span className="text-fg-muted text-sm">
            {t('common.total', { count: commentListQuery.data?.total ?? 0 })}
          </span>
        }
      >
        <div className="flex flex-1 flex-col">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap gap-3">
              <Input
                allowClear
                className="w-full lg:max-w-72"
                placeholder={t('content.comment.filters.keyword')}
                prefix={<Search className="text-fg-muted size-4" />}
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value)
                  setPage(1)
                }}
              />
              <Select
                allowClear
                className="w-full lg:w-44"
                options={COMMENT_STATUS_OPTIONS.map((item) => ({ label: t(item.label), value: item.value }))}
                placeholder={t('content.comment.filters.status')}
                value={status}
                onChange={(value) => {
                  setStatus(value || undefined)
                  setPage(1)
                }}
              />
              <Select
                allowClear
                className="w-full lg:w-72"
                options={postOptions}
                optionFilterProp="label"
                placeholder={t('content.comment.filters.post')}
                showSearch
                value={postId}
                onChange={(value) => {
                  setPostId(value || undefined)
                  setPage(1)
                }}
              />
              <RangePicker
                allowClear
                className="w-full lg:w-auto"
                value={createdRange}
                onChange={(value) => {
                  setCreatedRange(value ?? null)
                  setPage(1)
                }}
              />
            </div>

            <Space wrap>
              <Button icon={<RefreshCw className="size-4" />} onClick={() => void refreshComments()}>
                {t('common.refresh')}
              </Button>
              <Button icon={<FilterX className="size-4" />} onClick={resetFilters}>
                {t('common.reset')}
              </Button>
            </Space>
          </div>

          <Table
            className={ARTICLE_TABLE_CLASSNAME}
            columns={columns}
            dataSource={currentItems}
            loading={commentListQuery.isLoading || postListQuery.isLoading}
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
              total: commentListQuery.data?.total,
            }}
          />
        </div>
      </Card>

      <Drawer
        open={drawerOpen}
        title={t('content.comment.detailTitle')}
        width={720}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedCommentId(undefined)
          setSelectedComment(undefined)
        }}
      >
        {commentDetailQuery.isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Spin size="large" />
          </div>
        ) : detailComment ? (
          <div className="flex flex-col gap-4">
            <Card size="small" className="rounded-2xl" title={t('content.comment.detailSummaryTitle')}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label={t('content.comment.columns.author')}>
                  {detailComment.authorName}
                </Descriptions.Item>
                <Descriptions.Item label={t('content.comment.columns.email')}>
                  {detailComment.authorEmail || t('content.comment.value.none')}
                </Descriptions.Item>
                <Descriptions.Item label={t('content.comment.columns.post')}>
                  {postTitleMap.get(detailComment.postId)?.title || detailComment.postId}
                </Descriptions.Item>
                <Descriptions.Item label={t('content.comment.columns.createdAt')}>
                  {formatDateTime(detailComment.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label={t('content.comment.columns.updatedAt')}>
                  {formatDateTime(detailComment.updatedAt)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" className="rounded-2xl" title={t('content.comment.detailContentTitle')}>
              <div className="whitespace-pre-wrap rounded-2xl border border-border-subtle bg-surface-subtle/20 p-4 text-sm leading-7 text-fg">
                {detailComment.content}
              </div>
            </Card>

            <Card size="small" className="rounded-2xl" title={t('content.comment.detailStatusTitle')}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {renderCommentStatus(detailComment.status, t)}
                  <span className="text-fg-muted text-sm">{t('content.comment.detailStatusHint')}</span>
                </div>

                <Select
                  className="w-full"
                  disabled={!canEditStatus}
                  options={COMMENT_REVIEW_OPTIONS.map((item) => ({ label: t(item.label), value: item.value }))}
                  value={editableStatus}
                  onChange={(value) => setEditableStatus(value as EditableCommentStatus)}
                />

                <Space wrap>
                  <Button
                    type="primary"
                    disabled={!canEditStatus}
                    loading={updateCommentStatusMutation.isPending}
                    onClick={() => void handleUpdateStatus()}
                  >
                    {t('common.save')}
                  </Button>
                  <Popconfirm
                    title={t('content.comment.deleteConfirmTitle')}
                    description={t('content.comment.deleteConfirmDescription')}
                    okText={t('common.confirm')}
                    cancelText={t('common.cancel')}
                    onConfirm={() => void handleDeleteComment(detailComment.id)}
                  >
                    <Button danger icon={<Trash2 className="size-4" />} loading={deleteCommentMutation.isPending}>
                      {t('common.delete')}
                    </Button>
                  </Popconfirm>
                </Space>

                {!canEditStatus ? <Text type="secondary">{t('content.comment.detailDeletedHint')}</Text> : null}
              </div>
            </Card>

            <Card size="small" className="rounded-2xl" title={t('content.comment.detailMetaTitle')}>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-border-subtle bg-surface-subtle/18 p-3">
                  <div className="text-fg-muted text-xs">{t('content.comment.columns.status')}</div>
                  <div className="mt-1 text-sm font-medium text-fg">
                    {t(`content.comment.status.${detailComment.status}`)}
                  </div>
                </div>
                <div className="rounded-2xl border border-border-subtle bg-surface-subtle/18 p-3">
                  <div className="text-fg-muted text-xs">{t('content.comment.columns.id')}</div>
                  <div className="mt-1 break-all text-sm font-medium text-fg">{detailComment.id}</div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Empty description={t('content.comment.detailEmpty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Drawer>
    </div>
  )
}
