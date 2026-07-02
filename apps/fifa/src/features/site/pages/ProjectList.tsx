import type { CreateProjectRequest, ProjectStatus, ProjectSummary, SaveProjectDraftRequest } from '@xdd-zone/contracts'
import type { TableProps } from 'antd'

import {
  useCreateProjectMutation,
  useCreateProjectPreviewTokenMutation,
  useProjectsQuery,
  usePublishProjectMutation,
  useSaveProjectDraftMutation,
} from '@fifa/api/projects'
import { FifaPageHeader } from '@fifa/components/common'
import { buildBoboTargetPreviewUrl } from '@fifa/features/content/utils/preview-url'
import { App, Button, Form, Input, InputNumber, Modal, Table, Tag } from 'antd'
import { Eye, FilePlus2, Pencil, Plus, RefreshCw, Send, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ProjectLinkFormValue {
  href: string
  label: string
}

interface ProjectFormValues {
  coverAssetId: string
  description: string
  links: ProjectLinkFormValue[]
  order: number
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

function getStatusColor(status: ProjectStatus) {
  if (status === 'published') return 'success'
  if (status === 'archived') return 'default'
  return 'warning'
}

function getStatusLabel(status: ProjectStatus, t: (key: string) => string) {
  if (status === 'draft') return t('site.projects.status.draft')
  if (status === 'published') return t('site.projects.status.published')
  if (status === 'archived') return t('site.projects.status.archived')
  return status
}

function toFormValues(project?: ProjectSummary): ProjectFormValues {
  return {
    coverAssetId: project?.coverAssetId ?? '',
    description: project?.description ?? '',
    links: project?.links ?? [],
    order: project?.order ?? 0,
    slug: project?.slug ?? '',
    title: project?.title ?? '',
  }
}

function toPayload(values: ProjectFormValues): CreateProjectRequest {
  return {
    coverAssetId: values.coverAssetId.trim() ? values.coverAssetId.trim() : null,
    description: values.description.trim() ? values.description.trim() : null,
    links: (values.links ?? [])
      .map((link) => ({
        href: link.href.trim(),
        label: link.label.trim(),
      }))
      .filter((link) => link.href && link.label),
    order: values.order ?? 0,
    slug: values.slug.trim(),
    title: values.title.trim(),
  }
}

export function ProjectList() {
  const { t } = useTranslation()
  const { message, modal } = App.useApp()
  const [form] = Form.useForm<ProjectFormValues>()
  const projectsQuery = useProjectsQuery()
  const createMutation = useCreateProjectMutation()
  const saveDraftMutation = useSaveProjectDraftMutation()
  const previewTokenMutation = useCreateProjectPreviewTokenMutation()
  const publishMutation = usePublishProjectMutation()
  const [editingProject, setEditingProject] = useState<ProjectSummary | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const projects = useMemo(() => (projectsQuery.data?.ok ? projectsQuery.data.data.projects : []), [projectsQuery.data])
  const loadError = projectsQuery.data && !projectsQuery.data.ok ? projectsQuery.data.error.message : undefined

  const summaryItems = useMemo(
    () => [
      { label: t('site.projects.summary.total'), value: projects.length },
      {
        label: t('site.projects.summary.published'),
        value: projects.filter((project) => project.status === 'published').length,
      },
    ],
    [projects, t],
  )

  const openCreateDialog = useCallback(() => {
    setEditingProject(null)
    form.setFieldsValue(toFormValues())
    setDialogOpen(true)
  }, [form])

  const openEditDialog = useCallback((project: ProjectSummary) => {
    setEditingProject(project)
    form.setFieldsValue(toFormValues(project))
    setDialogOpen(true)
  }, [form])

  const handleSave = async () => {
    const values = await form.validateFields()
    const payload = toPayload(values)
    const response = editingProject
      ? await saveDraftMutation.mutateAsync({
          id: editingProject.id,
          payload: payload satisfies SaveProjectDraftRequest,
        })
      : await createMutation.mutateAsync(payload)

    if (!response.ok) {
      message.error(response.error.message)
      return
    }

    setDialogOpen(false)
    setEditingProject(null)
    form.resetFields()
    message.success(editingProject ? t('site.projects.saveSuccess') : t('site.projects.createSuccess'))
  }

  const handlePublish = useCallback((project: ProjectSummary) => {
    modal.confirm({
      title: t('site.projects.publishConfirmTitle'),
      content: t('site.projects.publishConfirmMessage', { title: project.title }),
      okText: t('site.projects.publish'),
      cancelText: t('site.projects.cancel'),
      onOk: async () => {
        const response = await publishMutation.mutateAsync(project.id)

        if (!response.ok) {
          message.error(response.error.message)
          return
        }

        message.success(t('site.projects.publishSuccess'))
      },
    })
  }, [message, modal, publishMutation, t])

  const handlePreview = useCallback(async (project: ProjectSummary) => {
    const response = await previewTokenMutation.mutateAsync(project.id)

    if (!response.ok) {
      message.error(response.error.message)
      return
    }

    window.open(buildBoboTargetPreviewUrl('projects', project.id, response.data.token), '_blank', 'noopener,noreferrer')
  }, [message, previewTokenMutation])

  const columns = useMemo<TableProps<ProjectSummary>['columns']>(
    () => [
      {
        dataIndex: 'title',
        title: t('site.projects.table.title'),
        render: (title: string, project) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-fg">{title}</div>
            <div className="mt-1 truncate text-xs text-fg-muted">{project.id}</div>
          </div>
        ),
      },
      {
        dataIndex: 'slug',
        title: t('site.projects.table.slug'),
        width: 180,
        render: (slug: string) => <span className="font-mono text-xs">{slug}</span>,
      },
      {
        dataIndex: 'status',
        title: t('site.projects.table.status'),
        width: 120,
        render: (status: ProjectStatus) => <Tag color={getStatusColor(status)}>{getStatusLabel(status, t)}</Tag>,
      },
      {
        dataIndex: 'order',
        title: t('site.projects.table.order'),
        width: 100,
      },
      {
        dataIndex: 'updatedAt',
        title: t('site.projects.table.updatedAt'),
        width: 180,
        render: formatDateTime,
      },
      {
        dataIndex: 'publishedAt',
        title: t('site.projects.table.publishedAt'),
        width: 180,
        render: formatDateTime,
      },
      {
        key: 'actions',
        title: t('site.projects.table.actions'),
        width: 300,
        render: (_, project) => (
          <div className="flex flex-wrap gap-2">
            <Button size="small" icon={<Pencil className="size-4" />} onClick={() => openEditDialog(project)}>
              {t('site.projects.edit')}
            </Button>
            <Button
              size="small"
              icon={<Eye className="size-4" />}
              loading={previewTokenMutation.isPending}
              onClick={() => void handlePreview(project)}
            >
              {t('site.projects.preview')}
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<Send className="size-4" />}
              loading={publishMutation.isPending}
              onClick={() => handlePublish(project)}
            >
              {t('site.projects.publish')}
            </Button>
          </div>
        ),
      },
    ],
    [handlePreview, handlePublish, openEditDialog, previewTokenMutation.isPending, publishMutation.isPending, t],
  )

  return (
    <div className="space-y-5">
      <FifaPageHeader
        title={t('site.projects.title')}
        description={t('site.projects.description')}
        actions={
          <>
            <Button
              icon={<RefreshCw className="size-4" />}
              loading={projectsQuery.isFetching}
              onClick={() => projectsQuery.refetch()}
            >
              {t('site.projects.refresh')}
            </Button>
            <Button type="primary" icon={<FilePlus2 className="size-4" />} onClick={openCreateDialog}>
              {t('site.projects.create')}
            </Button>
          </>
        }
        summaryItems={summaryItems}
      />

      <section className="rounded-lg border border-border-subtle bg-surface">
        {loadError ? (
          <div className="border-b border-border-subtle px-4 py-3 text-sm text-danger">{loadError}</div>
        ) : null}
        <Table<ProjectSummary>
          columns={columns}
          dataSource={projects}
          loading={projectsQuery.isLoading}
          locale={{ emptyText: t('site.projects.emptyText') }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          rowKey="id"
          scroll={{ x: 1100 }}
        />
      </section>

      <Modal
        destroyOnHidden
        okText={editingProject ? t('site.projects.saveDraft') : t('site.projects.create')}
        onCancel={() => {
          setDialogOpen(false)
          setEditingProject(null)
          form.resetFields()
        }}
        onOk={() => void handleSave()}
        open={dialogOpen}
        title={editingProject ? t('site.projects.editProject') : t('site.projects.createProject')}
        width={820}
      >
        <Form form={form} layout="vertical">
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item
              name="title"
              label={t('site.projects.form.title')}
              rules={[{ required: true, message: t('site.projects.form.titleRequired') }]}
            >
              <Input placeholder={t('site.projects.form.titlePlaceholder')} />
            </Form.Item>
            <Form.Item
              name="slug"
              label={t('site.projects.form.slug')}
              rules={[{ required: true, message: t('site.projects.form.slugRequired') }]}
            >
              <Input placeholder={t('site.projects.form.slugPlaceholder')} />
            </Form.Item>
            <Form.Item name="coverAssetId" label={t('site.projects.form.coverAssetId')}>
              <Input placeholder={t('site.projects.form.coverAssetIdPlaceholder')} />
            </Form.Item>
            <Form.Item name="order" label={t('site.projects.form.order')}>
              <InputNumber className="w-full" min={0} precision={0} />
            </Form.Item>
          </div>
          <Form.Item name="description" label={t('site.projects.form.description')}>
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder={t('site.projects.form.descriptionPlaceholder')}
            />
          </Form.Item>

          <Form.List name="links">
            {(fields, { add, remove }) => (
              <div className="space-y-3">
                <div className="text-sm font-medium text-fg">{t('site.projects.form.links')}</div>
                {fields.map((field) => (
                  <div key={field.key} className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_auto]">
                    <Form.Item {...field} name={[field.name, 'label']} className="mb-0">
                      <Input placeholder={t('site.projects.form.linkLabelPlaceholder')} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'href']} className="mb-0">
                      <Input placeholder={t('site.projects.form.linkHrefPlaceholder')} />
                    </Form.Item>
                    <Button danger icon={<Trash2 className="size-4" />} onClick={() => remove(field.name)} />
                  </div>
                ))}
                <Button icon={<Plus className="size-4" />} onClick={() => add({ href: '', label: '' })}>
                  {t('site.projects.form.addLink')}
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  )
}
