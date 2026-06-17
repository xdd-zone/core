import type { TextSelection } from '@fifa/features/content/utils/editor'
import type { MdxComponent, PostDetail, PostFormat, PostStatus, SavePostDraftRequest } from '@xdd-zone/contracts'
import type { TextAreaRef } from 'antd/es/input/TextArea'

import {
  useContentPostQuery,
  useCreateContentPreviewTokenMutation,
  useMdxComponentsQuery,
  usePublishContentPostMutation,
  useSaveContentPostDraftMutation,
  useUploadContentImageMutation,
} from '@fifa/api/content'
import { FifaPageHeader } from '@fifa/components/common'
import { TiptapMarkdownEditor } from '@fifa/components/content/editor'
import { buildImageSnippet, insertTextAtSelection } from '@fifa/features/content/utils/editor'
import { buildBoboPreviewUrl } from '@fifa/features/content/utils/preview-url'
import { ignoreAntdUploadRequest } from '@fifa/features/content/utils/upload'
import { useNavigate, useParams } from '@tanstack/react-router'
import { App, Button, Form, Input, Tabs, Tag, Upload } from 'antd'
import { ExternalLink, ImagePlus, PackagePlus, Save, Send, SquareArrowOutUpRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface PostEditFormValue {
  coverAssetId?: string
  excerpt?: string
  slug: string
  source: string
  title: string
}

const statusLabels: Record<PostStatus, string> = {
  archived: '已归档',
  draft: '草稿',
  published: '已发布',
}

const formatLabels: Record<PostFormat, string> = {
  markdown: 'Markdown',
  mdx: 'MDX',
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

function toFormValue(post: PostDetail): PostEditFormValue {
  return {
    coverAssetId: post.coverAssetId ?? '',
    excerpt: post.excerpt ?? '',
    slug: post.slug,
    source: post.source,
    title: post.title,
  }
}

function toDraftPayload(format: PostFormat, values: PostEditFormValue): SavePostDraftRequest {
  return {
    coverAssetId: values.coverAssetId?.trim() ? values.coverAssetId.trim() : null,
    excerpt: values.excerpt?.trim() ? values.excerpt.trim() : null,
    format,
    slug: values.slug.trim(),
    source: values.source,
    title: values.title.trim(),
  }
}

function focusTextArea(ref: TextAreaRef | null, position: number) {
  const textarea = ref?.resizableTextArea?.textArea

  if (!textarea) {
    return
  }

  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(position, position)
  })
}

export function PostEdit() {
  const params = useParams({ strict: false }) as { postId?: string }
  const postId = params.postId ?? ''

  return <PostEditContent key={postId} postId={postId} />
}

interface PostEditContentProps {
  postId: string
}

function PostEditContent({ postId }: PostEditContentProps) {
  const { message, modal } = App.useApp()
  const navigate = useNavigate()
  const [form] = Form.useForm<PostEditFormValue>()
  const loadedPostIdRef = useRef<string | null>(null)
  const textAreaRef = useRef<TextAreaRef>(null)
  const [dirty, setDirty] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [selection, setSelection] = useState<TextSelection>({ end: 0, start: 0 })
  const postQuery = useContentPostQuery(postId)
  const mdxComponentsQuery = useMdxComponentsQuery()
  const saveDraftMutation = useSaveContentPostDraftMutation(postId)
  const previewTokenMutation = useCreateContentPreviewTokenMutation(postId)
  const publishMutation = usePublishContentPostMutation(postId)
  const uploadImageMutation = useUploadContentImageMutation()

  const post = postQuery.data?.ok ? postQuery.data.data.post : undefined
  const loadError = postQuery.data && !postQuery.data.ok ? postQuery.data.error.message : undefined
  const mdxComponents = mdxComponentsQuery.data?.ok ? mdxComponentsQuery.data.data.components : []
  const source = Form.useWatch('source', form) ?? ''

  useEffect(() => {
    if (!post || loadedPostIdRef.current === post.id) {
      return
    }

    form.setFieldsValue(toFormValue(post))
    loadedPostIdRef.current = post.id
  }, [form, post])

  useEffect(() => {
    if (!dirty) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [dirty])

  const saveDraft = useCallback(async () => {
    if (!post) {
      return undefined
    }

    const values = await form.validateFields()
    const response = await saveDraftMutation.mutateAsync(toDraftPayload(post.format, values))

    if (!response.ok) {
      message.error(response.error.message)
      return undefined
    }

    setDirty(false)
    message.success('草稿已保存')
    return response.data.post
  }, [form, message, post, saveDraftMutation])

  const handlePreview = useCallback(async () => {
    const savedPost = await saveDraft()

    if (!savedPost) {
      return
    }

    const tokenResponse = await previewTokenMutation.mutateAsync()

    if (!tokenResponse.ok) {
      message.error(tokenResponse.error.message)
      return
    }

    setPreviewUrl(buildBoboPreviewUrl(savedPost.id, tokenResponse.data.token))
  }, [message, previewTokenMutation, saveDraft])

  const handleOpenPreview = useCallback(() => {
    if (!previewUrl) {
      void handlePreview()
      return
    }

    window.open(previewUrl, '_blank', 'noopener,noreferrer')
  }, [handlePreview, previewUrl])

  const handlePublish = useCallback(() => {
    modal.confirm({
      title: '发布文章',
      content: dirty ? '当前有未保存内容。确认后会先保存草稿，再发布文章。' : '确认发布当前草稿。',
      okText: '发布',
      cancelText: '取消',
      onOk: async () => {
        if (dirty) {
          const savedPost = await saveDraft()

          if (!savedPost) {
            return
          }
        }

        const response = await publishMutation.mutateAsync()

        if (!response.ok) {
          message.error(response.error.message)
          return
        }

        setDirty(false)
        message.success('文章已发布')
      },
    })
  }, [dirty, message, modal, publishMutation, saveDraft])

  const updateSource = (nextSource: string) => {
    form.setFieldValue('source', nextSource)
    setDirty(true)
  }

  const insertSnippet = (snippet: string) => {
    if (!post) {
      return
    }

    if (post.format === 'mdx') {
      const nextSource = insertTextAtSelection(source, snippet, selection)
      const nextPosition = selection.start + snippet.length
      updateSource(nextSource)
      focusTextArea(textAreaRef.current, nextPosition)
      setSelection({ end: nextPosition, start: nextPosition })
      return
    }

    updateSource(`${source.trimEnd()}\n${snippet}`)
  }

  const handleInsertComponent = (component: MdxComponent) => {
    insertSnippet(`\n${component.snippet}\n`)
  }

  const handleUploadImage = async (file: File) => {
    if (!post) {
      return
    }

    const response = await uploadImageMutation.mutateAsync(file)

    if (!response.ok) {
      message.error(response.error.message)
      return
    }

    insertSnippet(buildImageSnippet(post.format, response.data.asset))
    message.success('图片已插入')
  }

  const handleBeforeUpload = async (file: File) => {
    return ignoreAntdUploadRequest(file, handleUploadImage, Upload.LIST_IGNORE)
  }

  if (loadError) {
    return (
      <div className="space-y-5">
        <FifaPageHeader
          title="编辑文章"
          description="当前文章读取失败。"
          onBack={() => void navigate({ to: '/content/posts' as never })}
        />
        <section className="rounded-lg border border-border-subtle bg-surface px-5 py-4 text-sm text-danger">
          {loadError}
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <FifaPageHeader
        title={post?.title ?? '编辑文章'}
        description="修改元信息和正文，手动保存草稿后再预览或发布。"
        backLabel="返回文章列表"
        onBack={() => void navigate({ to: '/content/posts' as never })}
        actions={
          post ? (
            <>
              <Button
                icon={<Save className="size-4" />}
                loading={saveDraftMutation.isPending}
                onClick={() => void saveDraft()}
              >
                保存草稿
              </Button>
              <Button
                icon={<SquareArrowOutUpRight className="size-4" />}
                loading={previewTokenMutation.isPending || saveDraftMutation.isPending}
                onClick={() => void handlePreview()}
              >
                预览
              </Button>
              <Button disabled={!previewUrl} icon={<ExternalLink className="size-4" />} onClick={handleOpenPreview}>
                新标签预览
              </Button>
              <Button
                icon={<Send className="size-4" />}
                loading={publishMutation.isPending}
                onClick={handlePublish}
                type="primary"
              >
                发布
              </Button>
            </>
          ) : null
        }
        summaryItems={
          post
            ? [
                {
                  label: '格式',
                  value: formatLabels[post.format],
                },
                {
                  label: '状态',
                  value: <Tag color={getStatusColor(post.status)}>{statusLabels[post.status]}</Tag>,
                },
                {
                  label: '更新时间',
                  value: formatDateTime(post.updatedAt),
                },
              ]
            : []
        }
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Form<PostEditFormValue>
          className="rounded-lg border border-border-subtle bg-surface px-5 py-4"
          disabled={postQuery.isLoading}
          form={form}
          layout="vertical"
          onValuesChange={() => setDirty(true)}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-4">
            <div>
              <div className="text-sm font-medium text-fg">正文编辑</div>
              <div className="mt-1 text-xs text-fg-muted">{dirty ? '有未保存内容' : '当前内容已保存'}</div>
            </div>
            {post ? <Tag>{formatLabels[post.format]}</Tag> : null}
          </div>

          <div className="grid gap-x-4 md:grid-cols-2">
            <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
              <Input placeholder="输入标题" />
            </Form.Item>
            <Form.Item name="slug" label="Slug" rules={[{ required: true, message: '请输入 slug' }]}>
              <Input placeholder="输入 slug" />
            </Form.Item>
          </div>

          <Form.Item name="excerpt" label="摘要">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} placeholder="输入摘要，可留空" />
          </Form.Item>

          <Form.Item name="coverAssetId" label="封面素材 ID">
            <Input placeholder="输入素材 ID，可留空" />
          </Form.Item>

          <Form.Item name="source" label="正文" rules={[{ required: true, message: '请输入正文' }]}>
            {post?.format === 'mdx' ? (
              <Input.TextArea
                ref={textAreaRef}
                autoSize={{ minRows: 18 }}
                className="font-mono text-sm"
                onClick={(event) =>
                  setSelection({
                    end: event.currentTarget.selectionEnd,
                    start: event.currentTarget.selectionStart,
                  })
                }
                onKeyUp={(event) =>
                  setSelection({
                    end: event.currentTarget.selectionEnd,
                    start: event.currentTarget.selectionStart,
                  })
                }
                onSelect={(event) =>
                  setSelection({
                    end: event.currentTarget.selectionEnd,
                    start: event.currentTarget.selectionStart,
                  })
                }
                placeholder="输入 MDX 源码"
              />
            ) : (
              <TiptapMarkdownEditor className="rounded-lg" value={source} onChange={updateSource} />
            )}
          </Form.Item>
        </Form>

        <aside className="rounded-lg border border-border-subtle bg-surface">
          <Tabs
            className="px-4"
            items={[
              {
                key: 'preview',
                label: '预览',
                children: (
                  <div className="space-y-3 pb-4">
                    <div className="text-sm text-fg-muted">点击预览会先保存草稿，再刷新下面的页面。</div>
                    <div className="h-[560px] overflow-hidden rounded-lg border border-border-subtle bg-surface-muted">
                      {previewUrl ? (
                        <iframe className="h-full w-full border-0" src={previewUrl} title="文章预览" />
                      ) : (
                        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-fg-muted">
                          暂无预览。保存草稿并生成 token 后显示。
                        </div>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: 'assets',
                label: '素材',
                children: (
                  <div className="space-y-3 pb-4">
                    <Upload beforeUpload={handleBeforeUpload} maxCount={1} showUploadList={false}>
                      <Button icon={<ImagePlus className="size-4" />} loading={uploadImageMutation.isPending}>
                        上传并插入图片
                      </Button>
                    </Upload>
                    <div className="text-xs leading-5 text-fg-muted">
                      图片上传到 Momo 后，会按当前文章格式插入 Markdown 或 MDX 片段。
                    </div>
                  </div>
                ),
              },
              {
                key: 'components',
                label: '组件',
                children: (
                  <div className="space-y-3 pb-4">
                    {post?.format !== 'mdx' ? (
                      <div className="rounded-lg border border-border-subtle bg-surface-muted px-3 py-3 text-sm text-fg-muted">
                        Markdown 文章不能插入 MDX 组件。
                      </div>
                    ) : null}

                    {mdxComponents.map((component) => (
                      <div key={component.name} className="rounded-lg border border-border-subtle px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-fg">{component.name}</div>
                            <div className="mt-1 text-xs leading-5 text-fg-muted">{component.description}</div>
                          </div>
                          <Button
                            disabled={post?.format !== 'mdx'}
                            icon={<PackagePlus className="size-4" />}
                            onClick={() => handleInsertComponent(component)}
                            size="small"
                          >
                            插入
                          </Button>
                        </div>
                        <pre className="mt-3 overflow-x-auto rounded-md bg-surface-muted px-3 py-2 text-xs text-fg-muted">
                          {component.snippet}
                        </pre>
                      </div>
                    ))}

                    {mdxComponents.length === 0 ? <div className="text-sm text-fg-muted">暂无组件。</div> : null}
                  </div>
                ),
              },
            ]}
          />
        </aside>
      </section>
    </div>
  )
}
