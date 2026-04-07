import type { CatppuccinThemeId } from '@console/stores/modules/setting'
import type { FormInstance } from 'antd'
import { TiptapMarkdownEditor } from '@console/components/content/editor'
import { Markdown } from '@console/components/ui'
import { slugify } from '@console/components/ui/markdown/utils/slugify'
import {
  POST_DETAIL_QUERY_KEY,
  POST_LIST_QUERY_KEY,
  PostRequestError,
  useCreatePostMutation,
  usePostDetailQuery,
  useUpdatePostMutation,
} from '@console/modules/post'
import { useSettingStore } from '@console/stores/modules/setting'
import { getPrimaryColorByTheme } from '@console/utils/theme'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { App as AntdApp, Button, Card, Form, Input, Select, Spin, Tag } from 'antd'
import { ArrowLeft, Save } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { buildPreviewSummaryItems } from '../shared/content-utils'
import { ARTICLE_PAGE_CLASSNAME, ARTICLE_PANEL_BODY_STYLE, ARTICLE_PANEL_CLASSNAME } from '../shared/page-layout'
import { getPreviewSyncStatusText, useContentPreviewSync } from '../shared/use-content-preview-sync'
import { useEditorNavigationBlocker, useEditorSaveShortcut } from '../shared/use-editor-experience'

interface PostEditorProps {
  mode: 'create' | 'edit'
  postId?: string
}

interface PostFormValues {
  category?: string
  coverImage?: string | null
  excerpt?: string | null
  markdown: string
  slug: string
  tags: string[]
  title: string
}

interface PostFormValueSource {
  category?: string | null
  coverImage?: string | null
  excerpt?: string | null
  markdown?: string | null
  slug?: string | null
  tags?: string[]
  title?: string | null
}

const EMPTY_POST_FORM_VALUES: PostFormValues = {
  category: '',
  coverImage: '',
  excerpt: '',
  markdown: '',
  slug: '',
  tags: [],
  title: '',
}

function normalizePostFormValues(values?: PostFormValueSource | null) {
  return {
    category: values?.category || '',
    coverImage: values?.coverImage || '',
    excerpt: values?.excerpt || '',
    markdown: values?.markdown || '',
    slug: values?.slug || '',
    tags: values?.tags ?? [],
    title: values?.title || '',
  } satisfies PostFormValues
}

function serializePostFormValues(values?: PostFormValueSource | null) {
  return JSON.stringify(normalizePostFormValues(values))
}

interface PostTitleSlugFieldsProps {
  form: FormInstance<PostFormValues>
  isSlugManuallyEdited: boolean
  setIsSlugManuallyEdited: (value: boolean) => void
}

const PostTitleSlugFields = memo(
  ({ form, isSlugManuallyEdited, setIsSlugManuallyEdited }: PostTitleSlugFieldsProps) => {
    const { t } = useTranslation()
    const title = Form.useWatch('title', form) ?? ''
    const slug = Form.useWatch('slug', form) ?? ''
    const suggestedSlug = useMemo(() => slugify(title), [title])

    useEffect(() => {
      if (!suggestedSlug || isSlugManuallyEdited || slug === suggestedSlug) {
        return
      }

      form.setFieldValue('slug', suggestedSlug)
    }, [form, isSlugManuallyEdited, slug, suggestedSlug])

    return (
      <div className="grid gap-x-5 md:grid-cols-2">
        <Form.Item
          label={t('content.post.fields.title')}
          name="title"
          rules={[{ required: true, message: t('content.post.validation.titleRequired') }]}
        >
          <Input placeholder={t('content.post.placeholders.title')} />
        </Form.Item>

        <Form.Item
          label={t('content.post.fields.slug')}
          name="slug"
          extra={
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-fg-muted">
                {isSlugManuallyEdited ? t('content.editor.slug.customHint') : t('content.editor.slug.autoHint')}
              </span>
              <Button
                type="link"
                size="small"
                className="px-0"
                disabled={!suggestedSlug}
                onClick={() => {
                  setIsSlugManuallyEdited(false)
                  form.setFieldValue('slug', suggestedSlug)
                }}
              >
                {t('content.editor.slug.useTitle')}
              </Button>
            </div>
          }
          rules={[{ required: true, message: t('content.post.validation.slugRequired') }]}
        >
          <Input
            placeholder={t('content.post.placeholders.slug')}
            onChange={(event) => {
              setIsSlugManuallyEdited(event.target.value !== suggestedSlug)
            }}
          />
        </Form.Item>
      </div>
    )
  },
)

interface PostMarkdownEditorFieldProps {
  form: FormInstance<PostFormValues>
}

const PostMarkdownEditorField = memo(({ form }: PostMarkdownEditorFieldProps) => {
  const { t } = useTranslation()
  const markdown = Form.useWatch('markdown', form) ?? ''

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-fg">{t('content.post.fields.markdown')}</div>
      <TiptapMarkdownEditor value={markdown} onChange={(value) => form.setFieldValue('markdown', value)} />
    </div>
  )
})

interface PostPreviewPanelProps {
  catppuccinTheme: CatppuccinThemeId
  form: FormInstance<PostFormValues>
  primaryColor: string
}

const PostPreviewPanel = memo(({ catppuccinTheme, form, primaryColor }: PostPreviewPanelProps) => {
  const { t } = useTranslation()
  const markdown = Form.useWatch('markdown', form) ?? ''
  const title = Form.useWatch('title', form) ?? ''
  const excerpt = Form.useWatch('excerpt', form) ?? ''
  const coverImage = Form.useWatch('coverImage', form) ?? ''
  const preview = useContentPreviewSync({
    coverImage,
    excerpt,
    markdown,
    title,
    type: 'post',
  })
  const previewSummaryItems = useMemo(
    () =>
      buildPreviewSummaryItems(t, {
        excerpt: preview.previewData?.excerpt,
        headings: preview.previewData?.toc.length,
        markdown,
      }),
    [markdown, preview.previewData?.excerpt, preview.previewData?.toc.length, t],
  )

  return (
    <Card
      className="flex flex-1 flex-col rounded-3xl"
      styles={{ body: ARTICLE_PANEL_BODY_STYLE }}
      title={t('content.preview.title')}
      extra={
        <Tag color={preview.state === 'failed' ? 'error' : preview.state === 'synced' ? 'success' : 'default'}>
          {getPreviewSyncStatusText(t, preview.state, preview.syncedAt)}
        </Tag>
      }
    >
      <div className="flex flex-1 flex-col">
        <div className="mb-4 flex flex-wrap gap-2">
          {previewSummaryItems.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-overlay-0/16 px-2.5 py-1 text-xs"
            >
              <span className="text-fg-muted">{item.label}</span>
              <span className="font-medium text-fg">{item.value}</span>
            </span>
          ))}
        </div>

        <div className="mb-4 rounded-2xl border border-border-subtle bg-surface-subtle/18 p-3">
          <div className="text-fg-muted text-xs">{t('content.preview.serverExcerpt')}</div>
          <div className="mt-1 text-sm leading-6 text-fg">
            {preview.previewData?.excerpt || t('content.preview.noExcerpt')}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <Markdown
            accentColor={primaryColor}
            catppuccinTheme={catppuccinTheme}
            showToc={false}
            value={preview.deferredMarkdown}
          />
        </div>
      </div>
    </Card>
  )
})

/**
 * 文章编辑器。
 */
export function PostEditor({ mode, postId }: PostEditorProps) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { catppuccinTheme } = useSettingStore()
  const primaryColor = getPrimaryColorByTheme(catppuccinTheme)
  const [form] = Form.useForm<PostFormValues>()

  const isEdit = mode === 'edit' && Boolean(postId)
  const postQuery = usePostDetailQuery(postId ?? '', isEdit)
  const createPostMutation = useCreatePostMutation()
  const updatePostMutation = useUpdatePostMutation()
  const hydratedPostSnapshotRef = useRef<string | null>(null)
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(isEdit)
  const [isDirty, setIsDirty] = useState(false)
  const [savedSnapshotOverride, setSavedSnapshotOverride] = useState<{ key: string; snapshot: string } | null>(null)
  const editorSnapshotKey = isEdit && postId ? `edit:${postId}` : 'create'
  const savedSnapshot = useMemo(() => {
    if (savedSnapshotOverride?.key === editorSnapshotKey) {
      return savedSnapshotOverride.snapshot
    }

    if (postQuery.data && isEdit) {
      return serializePostFormValues(postQuery.data)
    }

    return serializePostFormValues(EMPTY_POST_FORM_VALUES)
  }, [editorSnapshotKey, isEdit, postQuery.data, savedSnapshotOverride])

  useEffect(() => {
    if (!isEdit || !postQuery.data) {
      return
    }

    const nextValues = normalizePostFormValues(postQuery.data)
    const nextSnapshot = serializePostFormValues(nextValues)

    if (isDirty || hydratedPostSnapshotRef.current === nextSnapshot) {
      return
    }

    form.setFieldsValue(nextValues)
    hydratedPostSnapshotRef.current = nextSnapshot
  }, [form, isDirty, isEdit, postQuery.data])

  useEditorNavigationBlocker({
    cancelText: t('content.editor.stay'),
    enabled: isDirty,
    message: t('content.editor.leaveConfirm'),
    okText: t('content.editor.leave'),
  })
  useEditorSaveShortcut({
    enabled: !createPostMutation.isPending && !updatePostMutation.isPending,
    onSave: () => form.submit(),
  })

  const handleValuesChange = useCallback(
    (_: Partial<PostFormValues>, allValues: PostFormValues) => {
      const nextDirty = serializePostFormValues(allValues) !== savedSnapshot
      setIsDirty((current) => (current === nextDirty ? current : nextDirty))
    },
    [savedSnapshot],
  )

  const handleSubmit = async (values: PostFormValues) => {
    const nextValues = normalizePostFormValues(values)

    if (!nextValues.markdown.trim()) {
      message.warning(t('content.post.validation.markdownRequired'))
      return
    }

    try {
      const payload = {
        category: nextValues.category || null,
        coverImage: nextValues.coverImage || null,
        excerpt: nextValues.excerpt || null,
        markdown: nextValues.markdown,
        slug: nextValues.slug,
        tags: nextValues.tags,
        title: nextValues.title,
      }

      const nextPost =
        isEdit && postId
          ? await updatePostMutation.mutateAsync({ id: postId, ...payload })
          : await createPostMutation.mutateAsync(payload)

      const nextSnapshot = serializePostFormValues(nextPost)
      queryClient.setQueryData(POST_DETAIL_QUERY_KEY(nextPost.id), nextPost)
      await queryClient.invalidateQueries({ queryKey: POST_LIST_QUERY_KEY })
      form.setFieldsValue(normalizePostFormValues(nextPost))
      hydratedPostSnapshotRef.current = nextSnapshot
      setSavedSnapshotOverride({
        key: editorSnapshotKey,
        snapshot: nextSnapshot,
      })
      setIsDirty(false)
      setIsSlugManuallyEdited(true)
      message.success(isEdit ? t('content.post.messages.updateSuccess') : t('content.post.messages.createSuccess'))
      await navigate({ to: '/articles/$id', params: { id: nextPost.id } })
    } catch (error) {
      const errorMessage = error instanceof PostRequestError ? error.message : t('common.error')
      message.error(errorMessage)
    }
  }

  if (isEdit && postQuery.isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className={ARTICLE_PAGE_CLASSNAME}>
      <section className="rounded-[28px] border border-border-subtle bg-surface/85 px-5 py-5 shadow-sm backdrop-blur-xs sm:px-6">
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
            <h1 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
              {isEdit ? t('content.post.form.editTitle') : t('content.post.form.createTitle')}
            </h1>
            <p className="text-fg-muted mt-2 max-w-2xl text-sm">{t('content.post.form.description')}</p>
          </div>

          <div className="flex flex-col items-start gap-3 xl:max-w-[44%] xl:items-end">
            <span className="text-fg-muted inline-flex items-center text-xs">
              {isDirty ? t('content.editor.dirty') : t('content.editor.saved')}
              {' · '}
              {t('content.editor.shortcut')}
            </span>
          </div>
        </div>
      </section>

      <Form
        className="flex flex-1 flex-col"
        form={form}
        initialValues={EMPTY_POST_FORM_VALUES}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleValuesChange}
      >
        <Form.Item name="markdown" hidden>
          <Input />
        </Form.Item>
        <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1.16fr)_minmax(360px,0.84fr)]">
          <Card
            className={ARTICLE_PANEL_CLASSNAME}
            styles={{ body: ARTICLE_PANEL_BODY_STYLE }}
            title={t('content.post.form.editorTitle')}
            extra={<span className="text-fg-muted text-sm">{t('content.post.form.editorHint')}</span>}
          >
            <div className="flex flex-col gap-4">
              <PostTitleSlugFields
                form={form}
                isSlugManuallyEdited={isSlugManuallyEdited}
                setIsSlugManuallyEdited={setIsSlugManuallyEdited}
              />

              <div className="grid gap-x-5 md:grid-cols-2">
                <Form.Item label={t('content.post.fields.category')} name="category">
                  <Input placeholder={t('content.post.placeholders.category')} />
                </Form.Item>

                <Form.Item label={t('content.post.fields.tags')} name="tags">
                  <Select mode="tags" tokenSeparators={[',']} placeholder={t('content.post.placeholders.tags')} />
                </Form.Item>
              </div>

              <Form.Item label={t('content.post.fields.coverImage')} name="coverImage">
                <Input placeholder={t('content.post.placeholders.coverImage')} />
              </Form.Item>

              <Form.Item label={t('content.post.fields.excerpt')} name="excerpt">
                <Input.TextArea
                  rows={3}
                  maxLength={300}
                  showCount
                  placeholder={t('content.post.placeholders.excerpt')}
                />
              </Form.Item>

              <PostMarkdownEditorField form={form} />

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3">
                <span className="text-fg-muted text-xs">{t('content.post.form.editorHint')}</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<Save className="size-4" />}
                    loading={createPostMutation.isPending || updatePostMutation.isPending}
                  >
                    {t('common.save')}
                  </Button>
                  <Button onClick={() => void navigate({ to: '/articles' })}>{t('common.cancel')}</Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-5">
            <PostPreviewPanel catppuccinTheme={catppuccinTheme} form={form} primaryColor={primaryColor} />
          </div>
        </div>
      </Form>
    </div>
  )
}
