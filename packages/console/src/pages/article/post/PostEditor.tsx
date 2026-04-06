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
import { ArrowLeft, FileText, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { buildPreviewSummaryItems } from '../shared/content-utils'
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
  const markdown = Form.useWatch('markdown', form) ?? ''
  const title = Form.useWatch('title', form) ?? ''
  const excerpt = Form.useWatch('excerpt', form) ?? ''
  const coverImage = Form.useWatch('coverImage', form) ?? ''
  const slug = Form.useWatch('slug', form) ?? ''
  const category = Form.useWatch('category', form) ?? ''
  const watchedTags = Form.useWatch('tags', form)
  const tags = useMemo(() => watchedTags ?? [], [watchedTags])
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(isEdit)
  const [savedSnapshotOverride, setSavedSnapshotOverride] = useState<{ key: string; snapshot: string } | null>(null)
  const suggestedSlug = useMemo(() => slugify(title), [title])
  const editorSnapshotKey = isEdit && postId ? `edit:${postId}` : 'create'
  const savedSnapshot = useMemo(() => {
    if (savedSnapshotOverride?.key === editorSnapshotKey) {
      return savedSnapshotOverride.snapshot
    }

    if (postQuery.data && isEdit) {
      return JSON.stringify({
        category: postQuery.data.category || '',
        coverImage: postQuery.data.coverImage || '',
        excerpt: postQuery.data.excerpt || '',
        markdown: postQuery.data.markdown,
        slug: postQuery.data.slug,
        tags: postQuery.data.tags,
        title: postQuery.data.title,
      })
    }

    return JSON.stringify({
      category: '',
      coverImage: '',
      excerpt: '',
      markdown: '',
      slug: '',
      tags: [],
      title: '',
    })
  }, [editorSnapshotKey, isEdit, postQuery.data, savedSnapshotOverride])
  const draftSnapshot = useMemo(
    () =>
      JSON.stringify({
        category,
        coverImage,
        excerpt,
        markdown,
        slug,
        tags,
        title,
      }),
    [category, coverImage, excerpt, markdown, slug, tags, title],
  )
  const isDirty = draftSnapshot !== savedSnapshot

  useEffect(() => {
    if (!isEdit || !postQuery.data) {
      return
    }

    form.setFieldsValue({
      category: postQuery.data.category || undefined,
      coverImage: postQuery.data.coverImage,
      excerpt: postQuery.data.excerpt,
      markdown: postQuery.data.markdown,
      slug: postQuery.data.slug,
      tags: postQuery.data.tags,
      title: postQuery.data.title,
    })
  }, [form, isEdit, postQuery.data])

  useEffect(() => {
    if (!suggestedSlug || isSlugManuallyEdited || slug === suggestedSlug) {
      return
    }

    form.setFieldValue('slug', suggestedSlug)
  }, [form, isSlugManuallyEdited, slug, suggestedSlug])

  const preview = useContentPreviewSync({
    coverImage,
    excerpt,
    markdown,
    title,
    type: 'post',
  })

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

  const handleSubmit = async (values: PostFormValues) => {
    if (!markdown.trim()) {
      message.warning(t('content.post.validation.markdownRequired'))
      return
    }

    try {
      const payload = {
        category: values.category || null,
        coverImage: values.coverImage || null,
        excerpt: values.excerpt || null,
        markdown,
        slug: values.slug,
        tags: values.tags,
        title: values.title,
      }

      const nextPost =
        isEdit && postId
          ? await updatePostMutation.mutateAsync({ id: postId, ...payload })
          : await createPostMutation.mutateAsync(payload)

      queryClient.setQueryData(POST_DETAIL_QUERY_KEY(nextPost.id), nextPost)
      await queryClient.invalidateQueries({ queryKey: POST_LIST_QUERY_KEY })
      setSavedSnapshotOverride({
        key: editorSnapshotKey,
        snapshot: JSON.stringify({
          category: nextPost.category || '',
          coverImage: nextPost.coverImage || '',
          excerpt: nextPost.excerpt || '',
          markdown: nextPost.markdown,
          slug: nextPost.slug,
          tags: nextPost.tags,
          title: nextPost.title,
        }),
      })
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
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  const previewSummaryItems = buildPreviewSummaryItems(t, {
    excerpt: preview.previewData?.excerpt,
    headings: preview.previewData?.toc.length,
    markdown,
  })

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[28px] border border-border-subtle bg-surface/85 p-6 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <Button icon={<ArrowLeft className="size-4" />} onClick={() => void navigate({ to: '/articles' })}>
              {t('common.back')}
            </Button>
            <div className="mt-4 flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
                <FileText className="size-5" />
              </div>
              <div>
                <div className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">
                  {isEdit ? t('content.post.form.editEyebrow') : t('content.post.form.createEyebrow')}
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                  {isEdit ? t('content.post.form.editTitle') : t('content.post.form.createTitle')}
                </h1>
                <p className="text-fg-muted mt-2 text-sm">{t('content.post.form.description')}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-[44%] xl:justify-end">
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
        </div>
      </section>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="markdown" hidden>
          <Input />
        </Form.Item>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.16fr)_minmax(360px,0.84fr)]">
          <Card
            title={t('content.post.form.editorTitle')}
            extra={<span className="text-fg-muted text-sm">{t('content.post.form.editorHint')}</span>}
          >
            <div className="flex flex-col gap-4">
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

              <div>
                <div className="mb-2 text-sm font-medium text-fg">{t('content.post.fields.markdown')}</div>
                <TiptapMarkdownEditor value={markdown} onChange={(value) => form.setFieldValue('markdown', value)} />
              </div>

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
                <span className="text-fg-muted inline-flex items-center text-xs">
                  {isDirty ? t('content.editor.dirty') : t('content.editor.saved')}
                  {' · '}
                  {t('content.editor.shortcut')}
                </span>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-5">
            <Card
              title={t('content.preview.title')}
              extra={
                <Tag color={preview.state === 'failed' ? 'error' : preview.state === 'synced' ? 'success' : 'default'}>
                  {getPreviewSyncStatusText(t, preview.state, preview.syncedAt)}
                </Tag>
              }
            >
              <p className="text-fg-muted mb-4 text-sm">{t('content.preview.hint')}</p>
              <div className="mb-4 flex flex-wrap gap-2">
                <Tag>{t('content.preview.serverExcerpt')}</Tag>
                <span className="text-fg-muted text-sm">
                  {preview.previewData?.excerpt || t('content.preview.noExcerpt')}
                </span>
              </div>
              <Markdown
                accentColor={primaryColor}
                catppuccinTheme={catppuccinTheme}
                showToc={false}
                value={preview.deferredMarkdown}
              />
            </Card>
          </div>
        </div>
      </Form>
    </div>
  )
}
