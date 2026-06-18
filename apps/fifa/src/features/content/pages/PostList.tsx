import type { CreatePostRequest, PostStatus, PostSummary } from '@xdd-zone/contracts'
import type { TableProps } from 'antd'

import { useContentPostsQuery, useCreateContentPostMutation } from '@fifa/api/content'
import { FifaPageHeader } from '@fifa/components/common'
import { filterContentPosts } from '@fifa/features/content/utils/post-list'
import { useNavigate } from '@tanstack/react-router'
import { App, Button, Form, Input, Modal, Select, Table, Tag } from 'antd'
import { FilePlus2, Pencil, RefreshCw, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

const statusOptions: Array<{ label: string; value: PostStatus }> = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已归档', value: 'archived' },
]

const statusFilterOptions: Array<{ label: string; value: PostStatus | 'all' }> = [
  { label: '全部状态', value: 'all' },
  ...statusOptions,
]

const tableLocale = {
  emptyText: '暂无文章',
}

const tablePagination = {
  pageSize: 10,
  showSizeChanger: false,
}

const tableScroll = { x: 1040 }

interface CreatePostFormValue {
  slug: string
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

function getStatusLabel(status: PostStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status
}

function toInitialSource(title: string) {
  return `# ${title}\n\n`
}

export function PostList() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const postsQuery = useContentPostsQuery()
  const createPostMutation = useCreateContentPostMutation()
  const [form] = Form.useForm<CreatePostFormValue>()
  const [createOpen, setCreateOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<PostStatus | 'all'>('all')

  const posts = useMemo(() => (postsQuery.data?.ok ? postsQuery.data.data.posts : []), [postsQuery.data])
  const loadError = postsQuery.data && !postsQuery.data.ok ? postsQuery.data.error.message : undefined

  const filteredPosts = useMemo(() => {
    return filterContentPosts(posts, { keyword, status })
  }, [keyword, posts, status])

  const summaryItems = useMemo(
    () => [
      {
        label: '文章',
        value: posts.length,
      },
      {
        label: '当前结果',
        value: filteredPosts.length,
      },
    ],
    [filteredPosts.length, posts.length],
  )

  const columns = useMemo<TableProps<PostSummary>['columns']>(
    () => [
      {
        dataIndex: 'title',
        title: '标题',
        render: (title: string, post) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-fg">{title}</div>
            <div className="mt-1 truncate text-xs text-fg-muted">{post.id}</div>
          </div>
        ),
      },
      {
        dataIndex: 'slug',
        title: 'Slug',
        render: (slug: string) => <span className="font-mono text-xs">{slug}</span>,
      },
      {
        dataIndex: 'status',
        title: '状态',
        width: 110,
        render: (value: PostStatus) => <Tag color={getStatusColor(value)}>{getStatusLabel(value)}</Tag>,
      },
      {
        dataIndex: 'updatedAt',
        title: '更新时间',
        width: 180,
        render: formatDateTime,
      },
      {
        dataIndex: 'publishedAt',
        title: '发布时间',
        width: 180,
        render: formatDateTime,
      },
      {
        key: 'actions',
        title: '操作',
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
            编辑
          </Button>
        ),
      },
    ],
    [navigate],
  )

  const handleCreate = useCallback(async () => {
    const values = await form.validateFields()
    const payload: CreatePostRequest = {
      slug: values.slug,
      source: toInitialSource(values.title),
      title: values.title,
    }
    const response = await createPostMutation.mutateAsync(payload)

    if (!response.ok) {
      message.error(response.error.message)
      return
    }

    setCreateOpen(false)
    form.resetFields()
    message.success('文章已创建')
    await navigate({
      to: `/content/posts/${response.data.post.id}` as never,
    })
  }, [createPostMutation, form, message, navigate])

  return (
    <div className="space-y-5">
      <FifaPageHeader
        title="文章管理"
        description="管理后台文章草稿、发布状态和编辑入口。"
        actions={
          <>
            <Button
              icon={<RefreshCw className="size-4" />}
              loading={postsQuery.isFetching}
              onClick={() => void postsQuery.refetch()}
            >
              刷新
            </Button>
            <Button icon={<FilePlus2 className="size-4" />} onClick={() => setCreateOpen(true)} type="primary">
              新建文章
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
            placeholder="搜索标题或 slug"
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
          locale={tableLocale}
          pagination={tablePagination}
          rowKey="id"
          scroll={tableScroll}
        />
      </section>

      <Modal
        confirmLoading={createPostMutation.isPending}
        destroyOnHidden
        okText="创建"
        onCancel={() => setCreateOpen(false)}
        onOk={() => void handleCreate()}
        open={createOpen}
        title="新建文章"
      >
        <Form<CreatePostFormValue> form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="输入文章标题" />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true, message: '请输入 slug' }]}>
            <Input placeholder="例如 hello-world" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
