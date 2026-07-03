import type { CreatePostRequest, PostStatus, PostSummary } from '@xdd-zone/contracts'
import type { TableProps } from 'antd'

import {
  useContentCategoriesQuery,
  useContentPostMetaSuggestionStatusQuery,
  useContentPostsQuery,
  useContentTagsQuery,
  useCreateContentPostMutation,
  useGenerateContentPostMetaSuggestionMutation,
} from '@fifa/api/content'
import { FifaPageHeader } from '@fifa/components/common'
import { filterContentPosts } from '@fifa/features/content/utils/post-list'
import { useNavigate } from '@tanstack/react-router'
import { App, Button, Form, Input, Modal, Select, Space, Table, Tag, Tooltip } from 'antd'
import { FilePlus2, Pencil, RefreshCw, Search, Wand2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

const tablePagination = {
  pageSize: 10,
  showSizeChanger: false,
}

const tableScroll = { x: 1280 }

interface CreatePostFormValue {
  categoryId?: string
  slug: string
  tagIds?: string[]
  title: string
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getStatusColor(status: PostStatus) {
  if (status === 'published') {
    return 'success'
  }

  if (status === 'archived') {
    return 'default'
  }

  return 'warning'
}

function getStatusLabel(status: PostStatus, t: (key: string) => string) {
  if (status === 'draft') return t('content.posts.status.draft')
  if (status === 'published') return t('content.posts.status.published')
  if (status === 'archived') return t('content.posts.status.archived')
  return status
}

function toInitialSource(title: string) {
  return `# ${title}\n\n`
}

export function PostList() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const postsQuery = useContentPostsQuery()
  const categoriesQuery = useContentCategoriesQuery()
  const tagsQuery = useContentTagsQuery()
  const createPostMutation = useCreateContentPostMutation()
  const metaSuggestionStatusQuery = useContentPostMetaSuggestionStatusQuery()
  const metaSuggestionMutation = useGenerateContentPostMetaSuggestionMutation()
  const [form] = Form.useForm<CreatePostFormValue>()
  const [createOpen, setCreateOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<PostStatus | 'all'>('all')

  const statusFilterOptions = useMemo(
    () => [
      { label: t('content.posts.status.all'), value: 'all' },
      { label: t('content.posts.status.draft'), value: 'draft' },
      { label: t('content.posts.status.published'), value: 'published' },
      { label: t('content.posts.status.archived'), value: 'archived' },
    ],
    [t],
  )

  const posts = useMemo(() => (postsQuery.data?.ok ? postsQuery.data.data.posts : []), [postsQuery.data])
  const categories = useMemo(
    () => (categoriesQuery.data?.ok ? categoriesQuery.data.data.categories : []),
    [categoriesQuery.data],
  )
  const tags = useMemo(() => (tagsQuery.data?.ok ? tagsQuery.data.data.tags : []), [tagsQuery.data])
  const loadError = postsQuery.data && !postsQuery.data.ok ? postsQuery.data.error.message : undefined
  const metaSuggestionStatus = metaSuggestionStatusQuery.data?.ok
    ? metaSuggestionStatusQuery.data.data.status
    : undefined
  const metaSuggestionReady = metaSuggestionStatus?.ready ?? false
  const metaSuggestionDisabledReason = metaSuggestionStatus?.reason ?? t('content.posts.ai.statusUnknown')
  const categoryOptions = useMemo(
    () => categories.map((category) => ({ label: category.name, value: category.id })),
    [categories],
  )
  const tagOptions = useMemo(() => tags.map((tag) => ({ label: tag.name, value: tag.id })), [tags])

  const filteredPosts = useMemo(() => {
    return filterContentPosts(posts, { keyword, status })
  }, [keyword, posts, status])

  const summaryItems = useMemo(
    () => [
      {
        label: t('content.posts.summary.totalPosts'),
        value: posts.length,
      },
      {
        label: t('content.posts.summary.currentResults'),
        value: filteredPosts.length,
      },
    ],
    [filteredPosts.length, posts.length, t],
  )

  const columns = useMemo<TableProps<PostSummary>['columns']>(
    () => [
      {
        dataIndex: ['draft', 'title'],
        title: t('content.posts.table.title'),
        render: (title: string, post) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-fg">{title}</div>
            <div className="mt-1 truncate text-xs text-fg-muted">{post.id}</div>
          </div>
        ),
      },
      {
        dataIndex: ['draft', 'slug'],
        title: t('content.posts.table.slug'),
        render: (slug: string) => <span className="font-mono text-xs">{slug}</span>,
      },
      {
        dataIndex: 'status',
        title: t('content.posts.table.status'),
        width: 110,
        render: (value: PostStatus) => <Tag color={getStatusColor(value)}>{getStatusLabel(value, t)}</Tag>,
      },
      {
        dataIndex: ['draft', 'category'],
        title: t('content.posts.table.category'),
        width: 160,
        render: (category: PostSummary['draft']['category']) => (category ? <Tag>{category.name}</Tag> : '-'),
      },
      {
        dataIndex: ['draft', 'tags'],
        title: t('content.posts.table.tags'),
        width: 220,
        render: (tags: PostSummary['draft']['tags']) => (
          <div className="flex flex-wrap gap-1">
            {tags.length > 0 ? tags.map((tag) => <Tag key={tag.id}>{tag.name}</Tag>) : '-'}
          </div>
        ),
      },
      {
        dataIndex: 'updatedAt',
        title: t('content.posts.table.updatedAt'),
        width: 180,
        render: formatDateTime,
      },
      {
        dataIndex: ['published', 'publishedAt'],
        title: t('content.posts.table.publishedAt'),
        width: 180,
        render: formatDateTime,
      },
      {
        key: 'actions',
        title: t('content.posts.table.actions'),
        width: 110,
        render: (_, post) => (
          <Button
            icon={<Pencil className="size-4" />}
            onClick={() =>
              void navigate({
                to: `/content/posts/${post.id}` as never,
              })
            }
            size="small"
            type="link"
          >
            {t('content.posts.edit')}
          </Button>
        ),
      },
    ],
    [navigate, t],
  )

  const handleCreate = useCallback(async () => {
    const values = await form.validateFields()
    const payload: CreatePostRequest = {
      draft: {
        categoryId: values.categoryId || null,
        slug: values.slug,
        source: toInitialSource(values.title),
        tagIds: values.tagIds ?? [],
        title: values.title,
      },
    }
    const response = await createPostMutation.mutateAsync(payload)

    if (!response.ok) {
      message.error(response.error.message)
      return
    }

    setCreateOpen(false)
    form.resetFields()
    message.success(t('content.posts.createSuccess'))
    await navigate({
      to: `/content/posts/${response.data.post.id}` as never,
    })
  }, [createPostMutation, form, message, navigate, t])

  const handleGenerateSlug = useCallback(async () => {
    const title = form.getFieldValue('title')?.trim()

    if (!title) {
      message.warning(t('content.posts.form.titleRequired'))
      return
    }

    const response = await metaSuggestionMutation.mutateAsync({
      locale: 'zh-CN',
      mode: 'create',
      targets: ['slug'],
      title,
    })

    if (!response.ok) {
      message.error(response.error.message)
      return
    }

    const { slug, slugAvailable } = response.data.suggestion

    if (!slug) {
      message.warning(t('content.posts.ai.emptySuggestion'))
      return
    }

    form.setFieldValue('slug', slug)

    if (slugAvailable === false) {
      message.warning(t('content.posts.ai.slugConflict'))
      return
    }

    message.success(t('content.posts.ai.slugGenerated'))
  }, [form, message, metaSuggestionMutation, t])

  return (
    <div className="space-y-5">
      <FifaPageHeader
        title={t('content.posts.title')}
        description={t('content.posts.description')}
        actions={
          <>
            <Button
              icon={<RefreshCw className="size-4" />}
              loading={postsQuery.isFetching}
              onClick={() => void postsQuery.refetch()}
            >
              {t('content.posts.refresh')}
            </Button>
            <Button icon={<FilePlus2 className="size-4" />} onClick={() => setCreateOpen(true)} type="primary">
              {t('content.posts.createPost')}
            </Button>
          </>
        }
        summaryItems={summaryItems}
      />

      <section className="rounded-lg border border-border-subtle bg-surface">
        <div className="grid gap-3 border-b border-border-subtle px-4 py-4 md:grid-cols-[minmax(240px,1fr)_180px]">
          <Input
            allowClear
            prefix={<Search className="text-fg-muted size-4" />}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t('content.posts.searchPlaceholder')}
            value={keyword}
          />
          <Select options={statusFilterOptions} onChange={setStatus} value={status} />
        </div>

        {loadError ? (
          <div className="border-b border-border-subtle px-4 py-3 text-sm text-danger">{loadError}</div>
        ) : null}

        <Table<PostSummary>
          columns={columns}
          dataSource={filteredPosts}
          loading={postsQuery.isLoading}
          locale={{ emptyText: t('content.posts.emptyText') }}
          pagination={tablePagination}
          rowKey="id"
          scroll={tableScroll}
        />
      </section>

      <Modal
        confirmLoading={createPostMutation.isPending}
        destroyOnHidden
        okText={t('content.posts.create')}
        onCancel={() => setCreateOpen(false)}
        onOk={() => void handleCreate()}
        open={createOpen}
        title={t('content.posts.createPost')}
      >
        <Form<CreatePostFormValue> form={form} layout="vertical">
          <Form.Item
            name="title"
            label={t('content.posts.form.title')}
            rules={[{ required: true, message: t('content.posts.form.titleRequired') }]}
          >
            <Input placeholder={t('content.posts.form.titlePlaceholder')} />
          </Form.Item>
          <Form.Item label={t('content.posts.form.slug')} required>
            <Space.Compact className="w-full">
              <Form.Item
                name="slug"
                noStyle
                rules={[{ required: true, message: t('content.posts.form.slugRequired') }]}
              >
                <Input placeholder={t('content.posts.form.slugPlaceholder')} />
              </Form.Item>
              <Tooltip title={metaSuggestionReady ? t('content.posts.ai.generateSlug') : metaSuggestionDisabledReason}>
                <Button
                  disabled={!metaSuggestionReady}
                  icon={<Wand2 className="size-4" />}
                  loading={metaSuggestionMutation.isPending}
                  onClick={() => void handleGenerateSlug()}
                >
                  {t('content.posts.ai.generateSlug')}
                </Button>
              </Tooltip>
            </Space.Compact>
          </Form.Item>
          <Form.Item name="categoryId" label={t('content.posts.form.category')}>
            <Select
              allowClear
              loading={categoriesQuery.isLoading}
              options={categoryOptions}
              placeholder={t('content.posts.form.categoryPlaceholder')}
            />
          </Form.Item>
          <Form.Item name="tagIds" label={t('content.posts.form.tag')}>
            <Select
              allowClear
              loading={tagsQuery.isLoading}
              mode="multiple"
              options={tagOptions}
              placeholder={t('content.posts.form.tagPlaceholder')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
