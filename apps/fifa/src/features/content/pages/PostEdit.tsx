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

      <Form<PostEditFormValue>
        className="space-y-5"
        disabled={postQuery.isLoading}
        form={form}
        layout="vertical"
        onValuesChange={() => setDirty(true)}
      >
        <section className="overflow-hidden rounded-2xl border border-border-subtle bg-surface/85 shadow-sm">
          <div className="border-b border-border-subtle bg-surface-muted/45 px-5 py-4">
            <div>
              <div className="text-sm font-medium text-fg">文章信息</div>
              <div className="mt-1 text-xs text-fg-muted">标题、路径、摘要和封面素材。</div>
            </div>
          </div>

          <div className="px-5 py-4">
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

            <Form.Item className="mb-0" name="coverAssetId" label="封面素材 ID">
              <Input placeholder="输入素材 ID，可留空" />
            </Form.Item>
          </div>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          <section className="overflow-hidden rounded-2xl border border-border-subtle bg-surface/85 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-surface-muted/45 px-5 py-4">
              <div>
                <div className="text-sm font-medium text-fg">正文编辑</div>
                <div className="mt-1 text-xs text-fg-muted">{dirty ? '有未保存内容' : '当前内容已保存'}</div>
              </div>
              {post ? <Tag>{formatLabels[post.format]}</Tag> : null}
            </div>

            <div className="bg-surface/90">
              <Form.Item className="mb-0" name="source" rules={[{ required: true, message: '请输入正文' }]}>
                {post?.format === 'mdx' ? (
                  <Input.TextArea
                    ref={textAreaRef}
                    autoSize={{ minRows: 24 }}
                    className="!rounded-none border-0 font-mono text-sm leading-6 shadow-none focus:shadow-none"
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
                  <TiptapMarkdownEditor
                    className="rounded-none border-0 shadow-none [&_.ProseMirror]:min-h-[560px]"
                    value={source}
                    onChange={updateSource}
                  />
                )}
              </Form.Item>
            </div>
          </section>

          <aside className="overflow-hidden rounded-2xl border border-border-subtle bg-surface/85 shadow-sm xl:sticky xl:top-5">
            <div className="border-b border-border-subtle bg-surface-muted/45 px-5 py-4">
              <div className="text-sm font-medium text-fg">预览和素材</div>
              <div className="mt-1 text-xs text-fg-muted">预览会先保存草稿，再生成页面链接。</div>
            </div>

            <Tabs
              tabBarStyle={{ padding: '0 20px', marginBottom: 0 }}
              items={[
                {
                  key: 'preview',
                  label: '预览',
                  children: (
                    <div className="space-y-3 px-5 py-5">
                      {previewUrl ? (
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5 text-xs text-fg-muted">
                            <span className="relative flex size-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/40"></span>
                              <span className="relative inline-flex size-2 rounded-full bg-success"></span>
                            </span>
                            当前预览已生成
                          </span>
                          <Button
                            icon={<SquareArrowOutUpRight className="size-3.5" />}
                            loading={previewTokenMutation.isPending || saveDraftMutation.isPending}
                            onClick={() => void handlePreview()}
                            size="small"
                          >
                            更新
                          </Button>
                        </div>
                      ) : null}
                      <div className="h-[620px] overflow-hidden rounded-xl border border-border-subtle bg-surface-subtle shadow-inner">
                        {previewUrl ? (
                          <iframe className="h-full w-full border-0 bg-surface" src={previewUrl} title="文章预览" />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full border border-border-subtle bg-surface shadow-sm">
                              <SquareArrowOutUpRight className="size-5 text-fg-muted" />
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-fg">暂无预览</div>
                              <div className="text-xs text-fg-muted">生成后在此直接查看页面效果</div>
                            </div>
                            <Button
                              className="mt-2"
                              icon={<SquareArrowOutUpRight className="size-4" />}
                              loading={previewTokenMutation.isPending || saveDraftMutation.isPending}
                              onClick={() => void handlePreview()}
                            >
                              生成预览
                            </Button>
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
                    <div className="px-5 py-5">
                      <Upload 
                        className="block w-full [&_.ant-upload]:block [&_.ant-upload]:w-full" 
                        beforeUpload={handleBeforeUpload} 
                        maxCount={1} 
                        showUploadList={false}
                      >
                        <div className="group relative flex cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-border-subtle bg-surface/40 px-6 py-10 transition-all hover:border-primary/40 hover:bg-surface-muted/30">
                          {uploadImageMutation.isPending ? (
                            <div className="flex flex-col items-center gap-4">
                              <div className="flex size-12 items-center justify-center rounded-2xl bg-surface shadow-sm ring-1 ring-border-subtle">
                                <span className="relative flex size-3">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40"></span>
                                  <span className="relative inline-flex size-3 rounded-full bg-primary"></span>
                                </span>
                              </div>
                              <div className="text-sm font-medium text-fg">正在上传图片...</div>
                            </div>
                          ) : (
                            <>
                              <div className="flex size-12 items-center justify-center rounded-2xl bg-surface shadow-sm ring-1 ring-border-subtle transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow group-hover:ring-border">
                                <ImagePlus className="size-5 text-fg-muted transition-colors group-hover:text-primary" />
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-medium text-fg">选择或拖放图片至此处</div>
                                <div className="mt-2 px-2 text-[11px] leading-relaxed text-fg-muted/80">
                                  上传后，将自动根据当前文章格式，在编辑器光标位置生成图片代码。
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </Upload>
                    </div>
                  ),
                },
                {
                  key: 'components',
                  label: '组件',
                  children: (
                    <div className="space-y-4 px-5 py-5">
                      {post?.format !== 'mdx' ? (
                        <div className="rounded-xl border border-border-subtle bg-surface-muted/30 px-4 py-3 text-xs text-fg-muted">
                          当前格式不支持插入 MDX 组件。
                        </div>
                      ) : null}

                      <div className="space-y-3">
                        {mdxComponents.map((component) => (
                          <div
                            key={component.name}
                            className="group relative overflow-hidden rounded-xl border border-border-subtle bg-surface transition-all hover:border-border hover:shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3 border-b border-border-subtle/50 bg-surface-muted/20 px-3 py-2.5">
                              <div>
                                <div className="text-sm font-medium text-fg">{component.name}</div>
                                <div className="mt-0.5 text-[11px] text-fg-muted">{component.description}</div>
                              </div>
                              <Button
                                className="shrink-0 opacity-100 transition-opacity xl:opacity-0 xl:group-hover:opacity-100"
                                disabled={post?.format !== 'mdx'}
                                icon={<PackagePlus className="size-3.5" />}
                                onClick={() => handleInsertComponent(component)}
                                size="small"
                              >
                                插入
                              </Button>
                            </div>
                            <div className="bg-surface px-3 py-2.5">
                              <pre className="overflow-x-auto font-mono text-[11px] leading-5 text-fg-muted">
                                {component.snippet}
                              </pre>
                            </div>
                          </div>
                        ))}

                        {mdxComponents.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border-subtle py-8 text-center text-xs text-fg-muted">
                            暂无可用组件。
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </aside>
        </section>
      </Form>
    </div>
  )
}
