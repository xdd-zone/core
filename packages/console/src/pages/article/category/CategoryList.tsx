import type { Category, CreateCategoryBody } from '@console/modules/category'
import type { TableProps } from 'antd'

import { canAccessConsolePath, createPermissionKeySet } from '@console/app/access/access-control'
import { slugify } from '@console/components/ui/markdown/utils/slugify'
import {
  CATEGORY_LIST_QUERY_KEY,
  CategoryRequestError,
  useCategoryListQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from '@console/modules/category'
import { useCurrentUserPermissionsQuery } from '@console/modules/rbac'
import { useQueryClient } from '@tanstack/react-query'
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd'
import { FilePlus2, RefreshCw, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { formatDateTime } from '../shared/content-utils'
import {
  ARTICLE_PAGE_CLASSNAME,
  ARTICLE_PANEL_BODY_STYLE,
  ARTICLE_PANEL_CLASSNAME,
  ARTICLE_TABLE_CLASSNAME,
} from '../shared/page-layout'

interface CategoryFormValues {
  description?: string | null
  isVisible: boolean
  name: string
  slug: string
  sortOrder: number
}

const CATEGORY_VISIBLE_OPTIONS = [
  { label: 'common.all', value: '' },
  { label: 'content.category.visible.visible', value: 'true' },
  { label: 'content.category.visible.hidden', value: 'false' },
] as const

const EMPTY_CATEGORY_FORM_VALUES: CategoryFormValues = {
  description: '',
  isVisible: true,
  name: '',
  slug: '',
  sortOrder: 0,
}

function toCategoryFormValues(category: Category): CategoryFormValues {
  return {
    description: category.description ?? '',
    isVisible: category.isVisible,
    name: category.name,
    slug: category.slug,
    sortOrder: category.sortOrder,
  }
}

function toCategoryPayload(values: CategoryFormValues): CreateCategoryBody {
  return {
    description: values.description?.trim() || null,
    isVisible: values.isVisible,
    name: values.name.trim(),
    slug: values.slug.trim(),
    sortOrder: values.sortOrder ?? 0,
  }
}

/**
 * 分类管理页。
 */
export function CategoryList() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<CategoryFormValues>()

  const [keyword, setKeyword] = useState('')
  const [visibleFilter, setVisibleFilter] = useState<'' | 'false' | 'true'>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)

  const currentUserPermissionsQuery = useCurrentUserPermissionsQuery()
  const permissionKeys = useMemo(
    () => createPermissionKeySet(currentUserPermissionsQuery.data?.permissions),
    [currentUserPermissionsQuery.data?.permissions],
  )
  const canWrite = canAccessConsolePath('/articles/new', permissionKeys)

  const categoryListQuery = useCategoryListQuery({
    isVisible: visibleFilter ? visibleFilter === 'true' : undefined,
    keyword: keyword || undefined,
    page,
    pageSize,
  })
  const createCategoryMutation = useCreateCategoryMutation()
  const updateCategoryMutation = useUpdateCategoryMutation()
  const deleteCategoryMutation = useDeleteCategoryMutation()

  const categories = categoryListQuery.data?.items ?? []
  const summaryItems = [
    { label: t('content.category.summary.total'), value: categoryListQuery.data?.total ?? 0 },
    {
      label: t('content.category.summary.visible'),
      value: categories.filter((item) => item.isVisible).length,
    },
    {
      label: t('content.category.summary.hidden'),
      value: categories.filter((item) => !item.isVisible).length,
    },
  ]

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setIsSlugManuallyEdited(false)
    form.resetFields()
  }, [form])

  const openCreateModal = useCallback(() => {
    setEditingCategory(null)
    setIsSlugManuallyEdited(false)
    setIsModalOpen(true)
    form.setFieldsValue(EMPTY_CATEGORY_FORM_VALUES)
  }, [form])

  const openEditModal = useCallback(
    (category: Category) => {
      setEditingCategory(category)
      setIsSlugManuallyEdited(true)
      setIsModalOpen(true)
      form.setFieldsValue(toCategoryFormValues(category))
    },
    [form],
  )

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields()
      const payload = toCategoryPayload(values)

      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({ id: editingCategory.id, ...payload })
        message.success(t('content.category.messages.updated'))
      } else {
        await createCategoryMutation.mutateAsync(payload)
        message.success(t('content.category.messages.created'))
      }

      closeModal()
      await queryClient.invalidateQueries({ queryKey: CATEGORY_LIST_QUERY_KEY })
    } catch (error) {
      if (!error || typeof error !== 'object' || !('status' in error)) {
        return
      }

      const errorMessage = error instanceof CategoryRequestError ? error.message : t('common.error')
      message.error(errorMessage)
    }
  }, [closeModal, createCategoryMutation, editingCategory, form, message, queryClient, t, updateCategoryMutation])

  const handleDelete = useCallback(
    async (category: Category) => {
      try {
        await deleteCategoryMutation.mutateAsync(category.id)
        await queryClient.invalidateQueries({ queryKey: CATEGORY_LIST_QUERY_KEY })
        message.success(t('content.category.messages.deleted'))
      } catch (error) {
        const errorMessage = error instanceof CategoryRequestError ? error.message : t('common.error')
        message.error(errorMessage)
      }
    },
    [deleteCategoryMutation, message, queryClient, t],
  )

  const handleVisibleToggle = useCallback(
    async (category: Category, isVisible: boolean) => {
      try {
        await updateCategoryMutation.mutateAsync({ id: category.id, isVisible })
        await queryClient.invalidateQueries({ queryKey: CATEGORY_LIST_QUERY_KEY })
        message.success(t('content.category.messages.visibilityUpdated'))
      } catch (error) {
        const errorMessage = error instanceof CategoryRequestError ? error.message : t('common.error')
        message.error(errorMessage)
      }
    },
    [message, queryClient, t, updateCategoryMutation],
  )

  const columns = useMemo<TableProps<Category>['columns']>(
    () => [
      {
        dataIndex: 'name',
        key: 'name',
        title: t('content.category.fields.name'),
        render: (_, record) => (
          <div className="min-w-0">
            <div className="font-medium text-fg">{record.name}</div>
            <div className="text-fg-muted mt-1 text-xs">{record.slug}</div>
          </div>
        ),
      },
      {
        dataIndex: 'description',
        key: 'description',
        title: t('content.category.fields.description'),
        render: (value: string | null) => value || '-',
      },
      {
        dataIndex: 'isVisible',
        key: 'isVisible',
        title: t('content.category.fields.visibility'),
        render: (value: boolean, record) =>
          canWrite ? (
            <Switch
              checked={value}
              checkedChildren={t('content.category.visible.visible')}
              unCheckedChildren={t('content.category.visible.hidden')}
              loading={updateCategoryMutation.isPending}
              onChange={(nextValue) => void handleVisibleToggle(record, nextValue)}
            />
          ) : (
            <Tag color={value ? 'success' : 'default'}>
              {value ? t('content.category.visible.visible') : t('content.category.visible.hidden')}
            </Tag>
          ),
      },
      {
        dataIndex: 'sortOrder',
        key: 'sortOrder',
        title: t('content.category.fields.sortOrder'),
        width: 96,
      },
      {
        dataIndex: 'postCount',
        key: 'postCount',
        title: t('content.category.fields.postCount'),
        width: 96,
      },
      {
        dataIndex: 'publishedPostCount',
        key: 'publishedPostCount',
        title: t('content.category.fields.publishedCount'),
        width: 96,
      },
      {
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        title: t('content.category.fields.updatedAt'),
        render: (value) => formatDateTime(value),
        width: 160,
      },
      {
        key: 'actions',
        title: t('common.actions'),
        width: 160,
        render: (_, record) =>
          canWrite ? (
            <Space size="small">
              <Button type="link" size="small" onClick={() => openEditModal(record)}>
                {t('common.edit')}
              </Button>
              <Popconfirm
                title={t('content.category.confirmDeleteTitle')}
                description={t('content.category.confirmDeleteDescription')}
                okText={t('common.confirm')}
                cancelText={t('common.cancel')}
                onConfirm={() => void handleDelete(record)}
              >
                <Button type="link" danger size="small">
                  {t('common.delete')}
                </Button>
              </Popconfirm>
            </Space>
          ) : (
            '-'
          ),
      },
    ],
    [canWrite, handleDelete, handleVisibleToggle, openEditModal, t, updateCategoryMutation.isPending],
  )

  return (
    <div className={ARTICLE_PAGE_CLASSNAME}>
      <section className="rounded-2xl border border-border-subtle bg-surface/72 px-4 py-4 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 max-w-2xl">
            <h1 className="text-fg text-xl font-semibold tracking-tight">{t('menu.categoryManagement')}</h1>
            <p className="text-fg-muted mt-1.5 text-sm">{t('content.category.description')}</p>
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
        title={t('content.category.resultsTitle')}
        extra={
          <Space>
            {canWrite ? (
              <Button type="primary" icon={<FilePlus2 className="size-4" />} onClick={openCreateModal}>
                {t('content.category.actions.create')}
              </Button>
            ) : null}
            <span className="text-fg-muted text-sm">
              {t('common.total', { count: categoryListQuery.data?.total ?? 0 })}
            </span>
          </Space>
        }
      >
        <div className="flex flex-1 flex-col">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
              <Input
                allowClear
                className="min-w-0 lg:w-80"
                placeholder={t('content.category.keywordPlaceholder')}
                prefix={<Search className="text-fg-muted size-4" />}
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value)
                  setPage(1)
                }}
              />
              <Select
                className="w-full lg:w-44"
                options={CATEGORY_VISIBLE_OPTIONS.map((item) => ({ label: t(item.label), value: item.value }))}
                value={visibleFilter}
                onChange={(value) => {
                  setVisibleFilter(value)
                  setPage(1)
                }}
              />
            </div>

            <Button
              icon={<RefreshCw className="size-4" />}
              onClick={() => {
                setKeyword('')
                setVisibleFilter('')
                setPage(1)
                setPageSize(20)
              }}
            >
              {t('common.reset')}
            </Button>
          </div>

          <Table
            className={ARTICLE_TABLE_CLASSNAME}
            columns={columns}
            dataSource={categoryListQuery.data?.items}
            loading={categoryListQuery.isLoading}
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
              total: categoryListQuery.data?.total,
            }}
          />
        </div>
      </Card>

      <Modal
        forceRender
        title={editingCategory ? t('content.category.form.editTitle') : t('content.category.form.createTitle')}
        open={isModalOpen}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        confirmLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
        onCancel={closeModal}
        onOk={() => void handleSubmit()}
      >
        <Form
          form={form}
          initialValues={EMPTY_CATEGORY_FORM_VALUES}
          layout="vertical"
          className="pt-2"
          onValuesChange={(changedValues: Partial<CategoryFormValues>, allValues) => {
            if ('slug' in changedValues) {
              setIsSlugManuallyEdited(true)
              return
            }

            if ('name' in changedValues && !isSlugManuallyEdited) {
              form.setFieldValue('slug', slugify(allValues.name ?? ''))
            }
          }}
        >
          <Form.Item
            label={t('content.category.fields.name')}
            name="name"
            rules={[{ required: true, message: t('content.category.validation.nameRequired') }]}
          >
            <Input placeholder={t('content.category.placeholders.name')} />
          </Form.Item>

          <Form.Item
            label={t('content.category.fields.slug')}
            name="slug"
            rules={[{ required: true, message: t('content.category.validation.slugRequired') }]}
          >
            <Input placeholder={t('content.category.placeholders.slug')} />
          </Form.Item>

          <Form.Item label={t('content.category.fields.description')} name="description">
            <Input.TextArea
              rows={3}
              maxLength={300}
              showCount
              placeholder={t('content.category.placeholders.description')}
            />
          </Form.Item>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item label={t('content.category.fields.sortOrder')} name="sortOrder">
              <InputNumber className="w-full" step={1} precision={0} />
            </Form.Item>

            <Form.Item label={t('content.category.fields.visibility')} name="isVisible" valuePropName="checked">
              <Switch
                checkedChildren={t('content.category.visible.visible')}
                unCheckedChildren={t('content.category.visible.hidden')}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
