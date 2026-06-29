import type { MdxSourceEditorHandle } from '@fifa/components/content/editor'
import type { TextSelection } from '@fifa/features/content/utils/editor'
import type { MdxComponent, PostDetail, PostStatus, SavePostDraftRequest } from '@xdd-zone/contracts'
import type { TabsProps } from 'antd'

import {
  useContentAssetsQuery,
  useContentCategoriesQuery,
  useContentPostQuery,
  useContentTagsQuery,
  useCreateContentPreviewTokenMutation,
  useGenerateContentPostMetaSuggestionMutation,
  useMdxComponentsQuery,
  usePublishContentPostMutation,
  useSaveContentPostDraftMutation,
  useUploadContentImageMutation,
} from '@fifa/api/content'
import { FifaPageHeader } from '@fifa/components/common'
import { buildImageSnippet, insertTextAtSelection } from '@fifa/features/content/utils/editor'
import { buildBoboPreviewUrl } from '@fifa/features/content/utils/preview-url'
import { ignoreAntdUploadRequest } from '@fifa/features/content/utils/upload'
import { useTabBarStore } from '@fifa/stores'
import { useLocation, useNavigate, useParams } from '@tanstack/react-router'
import { App, Button, Form, Input, Modal, Select, Tabs, Tag, Upload } from 'antd'
import { ExternalLink, ImagePlus, PackagePlus, Save, Send, SquareArrowOutUpRight, Wand2 } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const MdxSourceEditor = lazy(() =>
  import('@fifa/components/content/editor').then((mod) => ({ default: mod.MdxSourceEditor })),
)

const EMPTY_MDX_COMPONENTS: MdxComponent[] = []

interface PostEditFormValue {
  categoryId?: string
  coverAssetId?: string
  excerpt?: string
  slug: string
  source: string
  tagIds?: string[]
  title: string
}

function getStatusLabel(status: PostStatus, t: (key: string) => string) {
  if (status === 'archived') return t('content.posts.status.archived')
  if (status === 'draft') return t('content.posts.status.draft')
  if (status === 'published') return t('content.posts.status.published')
  return status
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
    categoryId: post.category?.id ?? undefined,
    coverAssetId: post.coverAssetId ?? '',
    excerpt: post.excerpt ?? '',
    slug: post.slug,
    source: post.source,
    tagIds: post.tags.map((tag) => tag.id),
    title: post.title,
  }
}

function toDraftPayload(values: PostEditFormValue): SavePostDraftRequest {
  return {
    categoryId: values.categoryId || null,
    coverAssetId: values.coverAssetId?.trim() ? values.coverAssetId.trim() : null,
    excerpt: values.excerpt?.trim() ? values.excerpt.trim() : null,
    slug: values.slug.trim(),
    source: values.source,
    tagIds: values.tagIds ?? [],
    title: values.title.trim(),
  }
}

function MdxSourceEditorFallback() {
  const { t } = useTranslation()
  return (
    <div className="flex h-full items-center justify-center bg-surface/90 text-sm text-fg-muted">
      {t('content.postEdit.loadingEditor')}
    </div>
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
  const { t } = useTranslation()
  const { message, modal } = App.useApp()
  const navigate = useNavigate()
  const pathname = useLocation({
    select: (location) => location.pathname,
  })
  const updateTabByPath = useTabBarStore((state) => state.updateTabByPath)
  const [form] = Form.useForm<PostEditFormValue>()
  const loadedPostIdRef = useRef<string | null>(null)
  const editorRef = useRef<MdxSourceEditorHandle>(null)
  const saveDraftPromiseRef = useRef<Promise<PostDetail | undefined> | null>(null)
  const [dirty, setDirty] = useState(false)
  const [draftSaving, setDraftSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [selection, setSelection] = useState<TextSelection>({ end: 0, start: 0 })
  const postQuery = useContentPostQuery(postId)
  const categoriesQuery = useContentCategoriesQuery()
  const tagsQuery = useContentTagsQuery()
  const mdxComponentsQuery = useMdxComponentsQuery()
  const saveDraftMutation = useSaveContentPostDraftMutation(postId)
  const previewTokenMutation = useCreateContentPreviewTokenMutation(postId)
  const publishMutation = usePublishContentPostMutation(postId)
  const metaSuggestionMutation = useGenerateContentPostMetaSuggestionMutation()
  const uploadImageMutation = useUploadContentImageMutation()
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [pickerKeyword, setPickerKeyword] = useState('')
  const sidebarQuery = useContentAssetsQuery({ page: 1, pageSize: 12 })
  const pickerQuery = useContentAssetsQuery(
    { keyword: pickerKeyword, page: 1, pageSize: 24 },
    { enabled: assetPickerOpen },
  )

  const post = postQuery.data?.ok ? postQuery.data.data.post : undefined
  const loadError = postQuery.data && !postQuery.data.ok ? postQuery.data.error.message : undefined
  const mdxComponents = mdxComponentsQuery.data?.ok ? mdxComponentsQuery.data.data.components : EMPTY_MDX_COMPONENTS
  const source = Form.useWatch('source', form) ?? ''
  const categoryOptions = useMemo(
    () =>
      categoriesQuery.data?.ok
        ? categoriesQuery.data.data.categories.map((category) => ({ label: category.name, value: category.id }))
        : [],
    [categoriesQuery.data],
  )
  const tagOptions = useMemo(
    () => (tagsQuery.data?.ok ? tagsQuery.data.data.tags.map((tag) => ({ label: tag.name, value: tag.id })) : []),
    [tagsQuery.data],
  )
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

  const postSlug = post?.slug ?? ''
  const postTitle = post?.title ?? ''

  useEffect(() => {
    if (!postTitle) {
      return
    }

    updateTabByPath(pathname, {
      description: `${postSlug} / ${postId}`,
      label: postTitle,
      translateLabel: false,
    })
  }, [pathname, postId, postSlug, postTitle, updateTabByPath])

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

    if (saveDraftPromiseRef.current) {
      return saveDraftPromiseRef.current
    }

    setDraftSaving(true)

    const savePromise = (async () => {
      const values = await form.validateFields()
      const response = await saveDraftMutation.mutateAsync(toDraftPayload(values))

      if (!response.ok) {
        message.error(response.error.message)
        return undefined
      }

      setDirty(false)
      message.success(t('content.postEdit.draftSaved'))
      return response.data.post
    })()

    const guardedSavePromise = savePromise.finally(() => {
      if (saveDraftPromiseRef.current === guardedSavePromise) {
        saveDraftPromiseRef.current = null
        setDraftSaving(false)
      }
    })

    saveDraftPromiseRef.current = guardedSavePromise
    return guardedSavePromise
  }, [form, message, post, saveDraftMutation, t])

  const handleGenerateMeta = useCallback(
    async (targets: Array<'slug' | 'excerpt' | 'title'>) => {
      const values = form.getFieldsValue()
      const response = await metaSuggestionMutation.mutateAsync({
        excerpt: values.excerpt?.trim() || null,
        locale: 'zh-CN',
        mode: 'edit',
        slug: values.slug?.trim(),
        source: values.source,
        targets,
        title: values.title?.trim(),
      })

      if (!response.ok) {
        message.error(response.error.message)
        return
      }

      const suggestion = response.data.suggestion
      const nextValues: Partial<PostEditFormValue> = {}

      if (targets.includes('slug') && suggestion.slug) {
        nextValues.slug = suggestion.slug
      }

      if (targets.includes('excerpt') && suggestion.excerpt) {
        nextValues.excerpt = suggestion.excerpt
      }

      if (targets.includes('title') && suggestion.title) {
        nextValues.title = suggestion.title
      }

      if (Object.keys(nextValues).length === 0) {
        message.warning(t('content.postEdit.ai.emptySuggestion'))
        return
      }

      modal.confirm({
        cancelText: t('content.postEdit.cancel'),
        content: (
          <div className="space-y-3">
            {nextValues.title ? (
              <div>
                <div className="text-xs text-fg-muted">{t('content.postEdit.form.title')}</div>
                <div className="mt-1 text-sm text-fg">{nextValues.title}</div>
              </div>
            ) : null}
            {nextValues.slug ? (
              <div>
                <div className="text-xs text-fg-muted">{t('content.postEdit.form.slug')}</div>
                <div className="mt-1 font-mono text-sm text-fg">{nextValues.slug}</div>
                {suggestion.slugAvailable === false ? (
                  <div className="mt-1 text-xs text-warning">{t('content.postEdit.ai.slugConflict')}</div>
                ) : null}
              </div>
            ) : null}
            {nextValues.excerpt ? (
              <div>
                <div className="text-xs text-fg-muted">{t('content.postEdit.form.excerpt')}</div>
                <div className="mt-1 text-sm text-fg">{nextValues.excerpt}</div>
              </div>
            ) : null}
          </div>
        ),
        okText: t('content.postEdit.ai.apply'),
        onOk: () => {
          form.setFieldsValue(nextValues)
          setDirty(true)
          message.success(t('content.postEdit.ai.applied'))
        },
        title: t('content.postEdit.ai.applyTitle'),
      })
    },
    [form, message, metaSuggestionMutation, modal, t],
  )

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
      title: t('content.postEdit.publishConfirmTitle'),
      content: dirty ? t('content.postEdit.publishDirtyConfirmMessage') : t('content.postEdit.publishConfirmMessage'),
      okText: t('content.postEdit.publish'),
      cancelText: t('content.postEdit.cancel'),
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
        message.success(t('content.postEdit.publishSuccess'))
      },
    })
  }, [dirty, message, modal, publishMutation, saveDraft, t])

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
      message.success(t('content.postEdit.imageInserted'))
    },
    [insertSnippet, message, post, t, uploadImageMutation],
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
              label: t('content.postEdit.summary.status'),
              value: <Tag color={getStatusColor(post.status)}>{getStatusLabel(post.status, t)}</Tag>,
            },
            {
              label: t('content.postEdit.summary.updatedAt'),
              value: formatDateTime(post.updatedAt),
            },
          ]
        : [],
    [post, t],
  )

  const tabsItems = useMemo<TabsProps['items']>(
    () => [
      {
        key: 'preview',
        label: t('content.postEdit.previewTab'),
        children: (
          <div className="flex h-full flex-col space-y-3 p-5">
            {previewUrl ? (
              <div className="flex shrink-0 items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-xs text-fg-muted">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/40"></span>
                    <span className="relative inline-flex size-2 rounded-full bg-success"></span>
                  </span>
                  {t('content.postEdit.currentPreviewReady')}
                </span>
                <Button
                  icon={<SquareArrowOutUpRight className="size-3.5" />}
                  loading={previewTokenMutation.isPending || draftSaving}
                  onClick={() => void handlePreview()}
                  size="small"
                >
                  {t('content.postEdit.updatePreview')}
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
                    <div className="text-sm font-medium text-fg">{t('content.postEdit.noPreview')}</div>
                    <div className="text-xs text-fg-muted">{t('content.postEdit.noPreviewDescription')}</div>
                  </div>
                  <Button
                    className="mt-2"
                    icon={<SquareArrowOutUpRight className="size-4" />}
                    loading={previewTokenMutation.isPending || draftSaving}
                    onClick={() => void handlePreview()}
                  >
                    {t('content.postEdit.generatePreview')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'assets',
        label: t('content.postEdit.tabAssets'),
        children: (
          <div className="h-full overflow-y-auto p-5">
            <div className="space-y-4">
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
                      <div className="text-sm font-medium text-fg">{t('content.postEdit.uploadingImage')}</div>
                    </div>
                  ) : (
                    <>
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-surface shadow-sm ring-1 ring-border-subtle transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow group-hover:ring-border">
                        <ImagePlus className="size-5 text-fg-muted transition-colors group-hover:text-primary" />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-fg">{t('content.postEdit.selectOrDropImage')}</div>
                        <div className="mt-2 px-2 text-[11px] leading-relaxed text-fg-muted/80">
                          {t('content.postEdit.uploadDescription')}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Upload>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-fg">{t('content.postEdit.recentAssets')}</div>
                    <div className="mt-1 text-xs text-fg-muted">{t('content.postEdit.recentAssetsDescription')}</div>
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
                      <img
                        alt={asset.alt ?? asset.fileName}
                        className="size-12 rounded-lg object-cover"
                        src={asset.url ?? ''}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-fg">{asset.fileName}</div>
                        <div className="truncate text-xs text-fg-muted">
                          {asset.alt ?? t('content.postEdit.noDescription')}
                        </div>
                      </div>
                    </button>
                  ))}
                  {sidebarAssets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border-subtle py-8 text-center text-xs text-fg-muted">
                      {t('content.assets.emptyText')}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'components',
        label: t('content.postEdit.componentsTab'),
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
                      {t('content.postEdit.insert')}
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
                  {t('content.postEdit.mdxComponentsEmpty')}
                </div>
              ) : null}
            </div>
          </div>
        ),
      },
    ],
    [
      sidebarAssets,
      draftSaving,
      handleBeforeUpload,
      handleInsertComponent,
      handlePreview,
      insertSnippet,
      mdxComponents,
      previewTokenMutation.isPending,
      previewUrl,
      t,
      uploadImageMutation.isPending,
    ],
  )

  if (loadError) {
    return (
      <div className="space-y-5">
        <FifaPageHeader
          title={t('content.postEdit.editPost')}
          description={t('content.postEdit.error')}
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
        title={post?.title ?? t('content.postEdit.editPost')}
        description={t('content.postEdit.subtitle')}
        backLabel={t('content.postEdit.backToList')}
        onBack={() => void navigate({ to: '/content/posts' as never })}
        actions={
          post ? (
            <>
              <Button
                disabled={draftSaving}
                icon={<Save className="size-4" />}
                loading={draftSaving}
                onClick={() => void saveDraft()}
              >
                {t('content.postEdit.saveDraft')}
              </Button>
              <Button
                icon={<SquareArrowOutUpRight className="size-4" />}
                loading={previewTokenMutation.isPending || draftSaving}
                onClick={() => void handlePreview()}
              >
                {t('content.postEdit.previewTab')}
              </Button>
              <Button disabled={!previewUrl} icon={<ExternalLink className="size-4" />} onClick={handleOpenPreview}>
                {t('content.postEdit.previewInNewTab')}
              </Button>
              <Button
                icon={<Send className="size-4" />}
                loading={publishMutation.isPending}
                onClick={handlePublish}
                type="primary"
              >
                {t('content.postEdit.publish')}
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-fg">{t('content.postEdit.postInfo')}</div>
                <div className="mt-1 text-xs text-fg-muted">{t('content.postEdit.postInfoDescription')}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  icon={<Wand2 className="size-4" />}
                  loading={metaSuggestionMutation.isPending}
                  onClick={() => void handleGenerateMeta(['slug'])}
                  size="small"
                >
                  {t('content.postEdit.ai.generateSlug')}
                </Button>
                <Button
                  loading={metaSuggestionMutation.isPending}
                  onClick={() => void handleGenerateMeta(['excerpt'])}
                  size="small"
                >
                  {t('content.postEdit.ai.generateExcerpt')}
                </Button>
                <Button
                  loading={metaSuggestionMutation.isPending}
                  onClick={() => void handleGenerateMeta(['slug', 'excerpt'])}
                  size="small"
                >
                  {t('content.postEdit.ai.generateSlugAndExcerpt')}
                </Button>
              </div>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="grid gap-x-4 md:grid-cols-2">
              <Form.Item
                name="title"
                label={t('content.postEdit.form.title')}
                rules={[{ required: true, message: t('content.postEdit.form.titleRequired') }]}
              >
                <Input placeholder={t('content.postEdit.form.titlePlaceholder')} />
              </Form.Item>
              <Form.Item
                name="slug"
                label={t('content.postEdit.form.slug')}
                rules={[{ required: true, message: t('content.postEdit.form.slugRequired') }]}
              >
                <Input placeholder={t('content.postEdit.form.slugPlaceholder')} />
              </Form.Item>
            </div>

            <Form.Item name="excerpt" label={t('content.postEdit.form.excerpt')}>
              <Input.TextArea
                autoSize={{ minRows: 2, maxRows: 4 }}
                placeholder={t('content.postEdit.form.excerptPlaceholder')}
              />
            </Form.Item>

            <div className="grid gap-x-4 md:grid-cols-2">
              <Form.Item name="categoryId" label={t('content.postEdit.form.category')}>
                <Select
                  allowClear
                  loading={categoriesQuery.isLoading}
                  options={categoryOptions}
                  placeholder={t('content.postEdit.form.categoryPlaceholder')}
                />
              </Form.Item>
              <Form.Item name="tagIds" label={t('content.postEdit.form.tag')}>
                <Select
                  allowClear
                  loading={tagsQuery.isLoading}
                  mode="multiple"
                  options={tagOptions}
                  placeholder={t('content.postEdit.form.tagPlaceholder')}
                />
              </Form.Item>
            </div>

            <Form.Item className="mb-0" name="coverAssetId" label={t('content.postEdit.coverAssetId')}>
              <Input
                addonAfter={
                  <Button onClick={() => setAssetPickerOpen(true)} type="link">
                    {t('content.postEdit.chooseCoverAsset')}
                  </Button>
                }
                placeholder={t('content.postEdit.coverAssetIdPlaceholder')}
              />
            </Form.Item>
            {currentCoverAssetId ? (
              <div className="mt-3 text-xs text-fg-muted">
                {t('content.postEdit.currentCoverAssetId', { id: currentCoverAssetId })}
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid items-start gap-5 lg:grid-cols-2">
          <section className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface/85 shadow-sm lg:h-[calc(100vh-120px)]">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-surface-muted/45 px-5 py-4">
              <div>
                <div className="text-sm font-medium text-fg">{t('content.postEdit.editor.title')}</div>
                <div className="mt-1 text-xs text-fg-muted">
                  {dirty ? t('content.postEdit.editor.unsavedContent') : t('content.postEdit.editor.contentSaved')}
                </div>
              </div>
            </div>

            <div className="relative flex-1 bg-surface/90">
              <Form.Item
                className="absolute inset-0 mb-0! [&_.ant-form-item-control-input-content]:h-full [&_.ant-form-item-control-input]:h-full [&_.ant-form-item-control]:h-full [&_.ant-form-item-row]:h-full"
                name="source"
                rules={[{ required: true, message: t('content.postEdit.editor.sourceRequired') }]}
              >
                <Suspense fallback={<MdxSourceEditorFallback />}>
                  <MdxSourceEditor
                    ref={editorRef}
                    onChange={updateSource}
                    onSelectionChange={setSelection}
                    placeholder={t('content.postEdit.editor.mdxPlaceholder')}
                    readOnly={postQuery.isLoading}
                    value={source}
                  />
                </Suspense>
              </Form.Item>
            </div>
          </section>

          <aside className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface/85 shadow-sm lg:sticky lg:top-5 lg:h-[calc(100vh-120px)]">
            <div className="shrink-0 border-b border-border-subtle bg-surface-muted/45 px-5 py-4">
              <div className="text-sm font-medium text-fg">{t('content.postEdit.previewAndAssets')}</div>
              <div className="mt-1 text-xs text-fg-muted">{t('content.postEdit.previewAndAssetsDescription')}</div>
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
          onCancel={() => {
            setAssetPickerOpen(false)
            setPickerKeyword('')
          }}
          open={assetPickerOpen}
          title={t('content.postEdit.selectCoverAsset')}
          width={960}
        >
          <div className="space-y-4">
            <Input
              allowClear
              onChange={(event) => setPickerKeyword(event.target.value)}
              placeholder={t('content.postEdit.searchAssetPlaceholder')}
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
                    <img
                      alt={asset.alt ?? asset.fileName}
                      className="h-full w-full object-cover"
                      src={asset.url ?? ''}
                    />
                  </div>
                  <div className="space-y-1 px-3 py-2.5">
                    <div className="truncate text-sm font-medium text-fg">{asset.fileName}</div>
                    <div className="truncate text-xs text-fg-muted">
                      {asset.alt ?? t('content.postEdit.noDescription')}
                    </div>
                  </div>
                </button>
              ))}
              {pickerAssets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-subtle py-8 text-center text-xs text-fg-muted">
                  {t('content.assets.emptyText')}
                </div>
              ) : null}
            </div>
          </div>
        </Modal>
      </Form>
    </div>
  )
}
