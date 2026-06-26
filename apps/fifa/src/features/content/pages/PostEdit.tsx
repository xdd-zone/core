import type { MdxSourceEditorHandle } from '@fifa/components/content/editor'
import type { TextSelection } from '@fifa/features/content/utils/editor'
import type { MdxComponent, PostDetail, PostStatus, SavePostDraftRequest } from '@xdd-zone/contracts'
import type { TabsProps } from 'antd'

import {
  useContentAssetsQuery,
  useContentPostQuery,
  useCreateContentPreviewTokenMutation,
  useMdxComponentsQuery,
  usePublishContentPostMutation,
  useSaveContentPostDraftMutation,
  useUploadContentImageMutation,
} from '@fifa/api/content'
import { FifaPageHeader } from '@fifa/components/common'
import { buildImageSnippet, insertTextAtSelection } from '@fifa/features/content/utils/editor'
import { buildBoboPreviewUrl } from '@fifa/features/content/utils/preview-url'
import { ignoreAntdUploadRequest } from '@fifa/features/content/utils/upload'
import { useNavigate, useParams } from '@tanstack/react-router'
import { App, Button, Form, Input, Modal, Tabs, Tag, Upload } from 'antd'
import { ExternalLink, ImagePlus, PackagePlus, Save, Send, SquareArrowOutUpRight } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'

const MdxSourceEditor = lazy(() =>
  import('@fifa/components/content/editor').then((mod) => ({ default: mod.MdxSourceEditor })),
)

const EMPTY_MDX_COMPONENTS: MdxComponent[] = []

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

const tabsBarStyle = { marginBottom: 0, padding: '0 20px' }

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

function toDraftPayload(values: PostEditFormValue): SavePostDraftRequest {
  return {
    coverAssetId: values.coverAssetId?.trim() ? values.coverAssetId.trim() : null,
    excerpt: values.excerpt?.trim() ? values.excerpt.trim() : null,
    slug: values.slug.trim(),
    source: values.source,
    title: values.title.trim(),
  }
}

function MdxSourceEditorFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-surface/90 text-sm text-fg-muted">正在加载编辑器...</div>
  )
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
  const editorRef = useRef<MdxSourceEditorHandle>(null)
  const [dirty, setDirty] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [selection, setSelection] = useState<TextSelection>({ end: 0, start: 0 })
  const postQuery = useContentPostQuery(postId)
  const mdxComponentsQuery = useMdxComponentsQuery()
  const saveDraftMutation = useSaveContentPostDraftMutation(postId)
  const previewTokenMutation = useCreateContentPreviewTokenMutation(postId)
  const publishMutation = usePublishContentPostMutation(postId)
  const uploadImageMutation = useUploadContentImageMutation()
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [pickerKeyword, setPickerKeyword] = useState('')
  const sidebarQuery = useContentAssetsQuery({ page: 1, pageSize: 12 })
  const pickerQuery = useContentAssetsQuery({ keyword: pickerKeyword, page: 1, pageSize: 24 }, { enabled: assetPickerOpen })

  const post = postQuery.data?.ok ? postQuery.data.data.post : undefined
  const loadError = postQuery.data && !postQuery.data.ok ? postQuery.data.error.message : undefined
  const mdxComponents = mdxComponentsQuery.data?.ok ? mdxComponentsQuery.data.data.components : EMPTY_MDX_COMPONENTS
  const source = Form.useWatch('source', form) ?? ''
  const sidebarAssets = useMemo(() => (sidebarQuery.data?.ok ? sidebarQuery.data.data.assets : []), [sidebarQuery.data])
  const pickerAssets = useMemo(() => (pickerQuery.data?.ok ? pickerQuery.data.data.assets : []), [pickerQuery.data])
  const currentCoverAssetId = Form.useWatch('coverAssetId', form)

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
    const response = await saveDraftMutation.mutateAsync(toDraftPayload(values))

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

  const updateSource = useCallback(
    (nextSource: string) => {
      form.setFieldValue('source', nextSource)
      setDirty(true)
    },
    [form],
  )

  const insertSnippet = useCallback(
    (snippet: string) => {
      if (!post) {
        return
      }

      const nextSource = insertTextAtSelection(source, snippet, selection)
      const nextPosition = selection.start + snippet.length
      updateSource(nextSource)
      editorRef.current?.focusAt(nextPosition)
      setSelection({ end: nextPosition, start: nextPosition })
    },
    [post, selection, source, updateSource],
  )

  const handleInsertComponent = useCallback(
    (component: MdxComponent) => {
      insertSnippet(`\n${component.snippet}\n`)
    },
    [insertSnippet],
  )

  const handleUploadImage = useCallback(
    async (file: File) => {
      if (!post) {
        return
      }

      const response = await uploadImageMutation.mutateAsync(file)

      if (!response.ok) {
        message.error(response.error.message)
        return
      }

      insertSnippet(buildImageSnippet(response.data.asset))
      message.success('图片已插入')
    },
    [insertSnippet, message, post, uploadImageMutation],
  )

  const handleChooseCoverAsset = useCallback(
    (assetId: string) => {
      form.setFieldValue('coverAssetId', assetId)
      setDirty(true)
      setAssetPickerOpen(false)
      setPickerKeyword('')
    },
    [form],
  )

  const handleBeforeUpload = useCallback(
    async (file: File) => ignoreAntdUploadRequest(file, handleUploadImage, Upload.LIST_IGNORE),
    [handleUploadImage],
  )

  const summaryItems = useMemo(
    () =>
      post
        ? [
            {
              label: '状态',
              value: <Tag color={getStatusColor(post.status)}>{statusLabels[post.status]}</Tag>,
            },
            {
              label: '更新时间',
              value: formatDateTime(post.updatedAt),
            },
          ]
        : [],
    [post],
  )

  const tabsItems = useMemo<TabsProps['items']>(
    () => [
      {
        key: 'preview',
        label: '预览',
        children: (
          <div className="flex h-full flex-col space-y-3 p-5">
            {previewUrl ? (
              <div className="flex shrink-0 items-center justify-between gap-3">
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
            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border-subtle bg-surface-subtle shadow-inner">
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
          <div className="h-full overflow-y-auto p-5">
            <div className="space-y-4">
              <Upload className="block w-full [&_.ant-upload]:block [&_.ant-upload]:w-full" beforeUpload={handleBeforeUpload} maxCount={1} showUploadList={false}>
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
                        <div className="mt-2 px-2 text-[11px] leading-relaxed text-fg-muted/80">上传后，将自动在编辑器光标位置生成图片组件。</div>
                      </div>
                    </>
                  )}
                </div>
              </Upload>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-fg">最近素材</div>
                    <div className="mt-1 text-xs text-fg-muted">点一下就能把图片插进正文。</div>
                  </div>
                  <Button size="small" onClick={() => setAssetPickerOpen(true)}>
                    选封面
                  </Button>
                </div>
                <div className="grid gap-3">
                  {sidebarAssets.map((asset) => (
                    <button
                      key={asset.id}
                      className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface px-3 py-2 text-left transition-all hover:border-border hover:shadow-sm"
                      onClick={() => insertSnippet(buildImageSnippet(asset))}
                      type="button"
                    >
                      <img alt={asset.alt ?? asset.fileName} className="size-12 rounded-lg object-cover" src={asset.url ?? ''} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-fg">{asset.fileName}</div>
                        <div className="truncate text-xs text-fg-muted">{asset.alt ?? '未填写说明'}</div>
                      </div>
                    </button>
                  ))}
                  {sidebarAssets.length === 0 ? <div className="rounded-xl border border-dashed border-border-subtle py-8 text-center text-xs text-fg-muted">暂无素材</div> : null}
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'components',
        label: '组件',
        children: (
          <div className="h-full overflow-y-auto p-5">
            <div className="space-y-4">
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
    ],
    [
      sidebarAssets,
      handleBeforeUpload,
      handleInsertComponent,
      handlePreview,
      insertSnippet,
      mdxComponents,
      previewTokenMutation.isPending,
      previewUrl,
      saveDraftMutation.isPending,
      uploadImageMutation.isPending,
    ],
  )

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
        summaryItems={summaryItems}
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
              <Input
                addonAfter={
                  <Button onClick={() => setAssetPickerOpen(true)} type="link">
                    选择素材
                  </Button>
                }
                placeholder="输入素材 ID，可留空"
              />
            </Form.Item>
            {currentCoverAssetId ? <div className="mt-3 text-xs text-fg-muted">当前封面 ID：{currentCoverAssetId}</div> : null}
          </div>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          <section className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface/85 shadow-sm xl:h-[calc(100vh-200px)]">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-surface-muted/45 px-5 py-4">
              <div>
                <div className="text-sm font-medium text-fg">正文编辑</div>
                <div className="mt-1 text-xs text-fg-muted">{dirty ? '有未保存内容' : '当前内容已保存'}</div>
              </div>
            </div>

            <div className="relative flex-1 bg-surface/90">
              <Form.Item
                className="absolute inset-0 mb-0! [&_.ant-form-item-control-input-content]:h-full [&_.ant-form-item-control-input]:h-full [&_.ant-form-item-control]:h-full [&_.ant-form-item-row]:h-full"
                name="source"
                rules={[{ required: true, message: '请输入正文' }]}
              >
                <Suspense fallback={<MdxSourceEditorFallback />}>
                  <MdxSourceEditor
                    ref={editorRef}
                    onChange={updateSource}
                    onSelectionChange={setSelection}
                    placeholder="输入 MDX 源码"
                    readOnly={postQuery.isLoading}
                    value={source}
                  />
                </Suspense>
              </Form.Item>
            </div>
          </section>

          <aside className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface/85 shadow-sm xl:sticky xl:top-5 xl:h-[calc(100vh-200px)]">
            <div className="shrink-0 border-b border-border-subtle bg-surface-muted/45 px-5 py-4">
              <div className="text-sm font-medium text-fg">预览和素材</div>
              <div className="mt-1 text-xs text-fg-muted">预览会先保存草稿，再生成页面链接。</div>
            </div>

            <Tabs
              className="flex flex-1 flex-col overflow-hidden [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-content-holder]:overflow-hidden [&_.ant-tabs-content]:h-full [&_.ant-tabs-tabpane]:h-full"
              tabBarStyle={tabsBarStyle}
              items={tabsItems}
            />
          </aside>
        </section>

        <Modal
          destroyOnHidden
          footer={null}
          onCancel={() => { setAssetPickerOpen(false); setPickerKeyword('') }}
          open={assetPickerOpen}
          title="选择封面素材"
          width={960}
        >
          <div className="space-y-4">
            <Input
              allowClear
              onChange={(event) => setPickerKeyword(event.target.value)}
              placeholder="搜索文件名或说明"
              value={pickerKeyword}
            />
            <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto xl:grid-cols-3">
              {pickerAssets.map((asset) => (
                <button
                  key={asset.id}
                  className="group overflow-hidden rounded-xl border border-border-subtle bg-surface text-left transition-all hover:border-primary/40 hover:shadow-sm"
                  onClick={() => handleChooseCoverAsset(asset.id)}
                  type="button"
                >
                  <div className="aspect-square overflow-hidden bg-surface-subtle">
                    <img alt={asset.alt ?? asset.fileName} className="h-full w-full object-cover" src={asset.url ?? ''} />
                  </div>
                  <div className="space-y-1 px-3 py-2.5">
                    <div className="truncate text-sm font-medium text-fg">{asset.fileName}</div>
                    <div className="truncate text-xs text-fg-muted">{asset.alt ?? '未填写说明'}</div>
                  </div>
                </button>
              ))}
              {pickerAssets.length === 0 ? <div className="rounded-xl border border-dashed border-border-subtle py-8 text-center text-xs text-fg-muted">暂无素材</div> : null}
            </div>
          </div>
        </Modal>
      </Form>
    </div>
  )
}
