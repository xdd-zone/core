import type {
  Category,
  CreateCategoryRequest,
  CreateTagRequest,
  Tag,
  UpdateCategoryRequest,
  UpdateTagRequest,
} from '@xdd-zone/contracts'
import type { TableProps, TabsProps } from 'antd'
import type { PropsWithChildren } from 'react'

import {
  useContentCategoriesQuery,
  useContentTagsQuery,
  useCreateContentCategoryMutation,
  useCreateContentTagMutation,
  useDeleteContentCategoryMutation,
  useDeleteContentTagMutation,
  useUpdateContentCategoryMutation,
  useUpdateContentTagMutation,
} from '@fifa/api/content'
import { FifaPageHeader } from '@fifa/components/common'
import { Tag as AntTag, App, Button, Form, Input, Modal, Table, Tabs } from 'antd'
import { FilePlus2, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type TaxonomyKind = 'category' | 'tag'

interface CategoryFormValue {
  description?: string
  name: string
  slug: string
}

interface TagFormValue {
  name: string
  slug: string
}

interface CategoryDialogState {
  item: Category | null
  open: boolean
}

interface TagDialogState {
  item: Tag | null
  open: boolean
}

const emptyCategoryDialog: CategoryDialogState = { item: null, open: false }
const emptyTagDialog: TagDialogState = { item: null, open: false }
const tablePagination = { pageSize: 8, showSizeChanger: false }

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function matchesKeyword(item: Pick<Category, 'name' | 'slug'>, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase()

  if (!normalizedKeyword) {
    return true
  }

  return item.name.toLowerCase().includes(normalizedKeyword) || item.slug.toLowerCase().includes(normalizedKeyword)
}

function toCategoryPayload(values: CategoryFormValue): CreateCategoryRequest | UpdateCategoryRequest {
  return {
    description: values.description?.trim() ? values.description.trim() : null,
    name: values.name.trim(),
    slug: values.slug.trim(),
  }
}

function toTagPayload(values: TagFormValue): CreateTagRequest | UpdateTagRequest {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
  }
}

export function TaxonomyList() {
  const { t } = useTranslation()
  const { message, modal } = App.useApp()
  const [categoryKeyword, setCategoryKeyword] = useState('')
  const [tagKeyword, setTagKeyword] = useState('')
  const [categoryDialog, setCategoryDialog] = useState<CategoryDialogState>(emptyCategoryDialog)
  const [tagDialog, setTagDialog] = useState<TagDialogState>(emptyTagDialog)
  const [categoryForm] = Form.useForm<CategoryFormValue>()
  const [tagForm] = Form.useForm<TagFormValue>()

  const categoriesQuery = useContentCategoriesQuery()
  const tagsQuery = useContentTagsQuery()
  const createCategoryMutation = useCreateContentCategoryMutation()
  const updateCategoryMutation = useUpdateContentCategoryMutation()
  const deleteCategoryMutation = useDeleteContentCategoryMutation()
  const createTagMutation = useCreateContentTagMutation()
  const updateTagMutation = useUpdateContentTagMutation()
  const deleteTagMutation = useDeleteContentTagMutation()

  const categories = useMemo(
    () => (categoriesQuery.data?.ok ? categoriesQuery.data.data.categories : []),
    [categoriesQuery.data],
  )
  const tags = useMemo(() => (tagsQuery.data?.ok ? tagsQuery.data.data.tags : []), [tagsQuery.data])
  const categoryLoadError =
    categoriesQuery.data && !categoriesQuery.data.ok ? categoriesQuery.data.error.message : undefined
  const tagLoadError = tagsQuery.data && !tagsQuery.data.ok ? tagsQuery.data.error.message : undefined

  const filteredCategories = useMemo(
    () => categories.filter((category) => matchesKeyword(category, categoryKeyword)),
    [categories, categoryKeyword],
  )
  const filteredTags = useMemo(() => tags.filter((tag) => matchesKeyword(tag, tagKeyword)), [tagKeyword, tags])

  const summaryItems = useMemo(
    () => [
      { label: t('content.taxonomy.summary.categories'), value: categories.length },
      { label: t('content.taxonomy.summary.tags'), value: tags.length },
    ],
    [categories.length, tags.length],
  )

  const handleOpenCreate = useCallback(
    (kind: TaxonomyKind) => {
      if (kind === 'category') {
        categoryForm.resetFields()
        setCategoryDialog({ item: null, open: true })
        return
      }

      tagForm.resetFields()
      setTagDialog({ item: null, open: true })
    },
    [categoryForm, tagForm],
  )

  const handleOpenEditCategory = useCallback(
    (category: Category) => {
      categoryForm.setFieldsValue({
        description: category.description ?? '',
        name: category.name,
        slug: category.slug,
      })
      setCategoryDialog({ item: category, open: true })
    },
    [categoryForm],
  )

  const handleOpenEditTag = useCallback(
    (tag: Tag) => {
      tagForm.setFieldsValue({
        name: tag.name,
        slug: tag.slug,
      })
      setTagDialog({ item: tag, open: true })
    },
    [tagForm],
  )

  const handleSaveCategory = useCallback(async () => {
    const values = await categoryForm.validateFields()
    const payload = toCategoryPayload(values)
    const response = categoryDialog.item
      ? await updateCategoryMutation.mutateAsync({ id: categoryDialog.item.id, payload })
      : await createCategoryMutation.mutateAsync(payload as CreateCategoryRequest)

    if (!response.ok) {
      message.error(response.error.message)
      return
    }

    message.success(
      categoryDialog.item ? t('content.taxonomy.saveCategorySuccess') : t('content.taxonomy.createCategorySuccess'),
    )
    setCategoryDialog(emptyCategoryDialog)
    categoryForm.resetFields()
  }, [categoryDialog.item, categoryForm, createCategoryMutation, message, updateCategoryMutation])

  const handleSaveTag = useCallback(async () => {
    const values = await tagForm.validateFields()
    const payload = toTagPayload(values)
    const response = tagDialog.item
      ? await updateTagMutation.mutateAsync({ id: tagDialog.item.id, payload })
      : await createTagMutation.mutateAsync(payload as CreateTagRequest)

    if (!response.ok) {
      message.error(response.error.message)
      return
    }

    message.success(tagDialog.item ? t('content.taxonomy.saveTagSuccess') : t('content.taxonomy.createTagSuccess'))
    setTagDialog(emptyTagDialog)
    tagForm.resetFields()
  }, [createTagMutation, message, tagDialog.item, tagForm, updateTagMutation])

  const handleDeleteCategory = useCallback(
    (category: Category) => {
      modal.confirm({
        title: t('content.taxonomy.categoryDeleteConfirmTitle'),
        content: t('content.taxonomy.categoryDeleteConfirmMessage', { name: category.name }),
        okText: t('content.taxonomy.delete'),
        okButtonProps: { danger: true },
        cancelText: t('content.taxonomy.cancel'),
        onOk: async () => {
          const response = await deleteCategoryMutation.mutateAsync(category.id)

          if (!response.ok) {
            message.error(response.error.message)
            return
          }

          message.success(t('content.taxonomy.categoryDeleteSuccess'))
        },
      })
    },
    [deleteCategoryMutation, message, modal],
  )

  const handleDeleteTag = useCallback(
    (tag: Tag) => {
      modal.confirm({
        title: t('content.taxonomy.tagDeleteConfirmTitle'),
        content: t('content.taxonomy.tagDeleteConfirmMessage', { name: tag.name }),
        okText: t('content.taxonomy.delete'),
        okButtonProps: { danger: true },
        cancelText: t('content.taxonomy.cancel'),
        onOk: async () => {
          const response = await deleteTagMutation.mutateAsync(tag.id)

          if (!response.ok) {
            message.error(response.error.message)
            return
          }

          message.success(t('content.taxonomy.tagDeleteSuccess'))
        },
      })
    },
    [deleteTagMutation, message, modal],
  )

  const categoryColumns = useMemo<TableProps<Category>['columns']>(
    () => [
      {
        dataIndex: 'name',
        title: t('content.taxonomy.table.category'),
        render: (name: string, category) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-fg">{name}</div>
            <div className="mt-1 truncate font-mono text-xs text-fg-muted">{category.slug}</div>
          </div>
        ),
      },
      {
        dataIndex: 'description',
        title: t('content.taxonomy.table.description'),
        render: (description: string | null) => description || '-',
      },
      {
        dataIndex: 'postCount',
        title: t('content.taxonomy.table.postCount'),
        width: 90,
        render: (postCount: number) => <AntTag>{postCount}</AntTag>,
      },
      {
        dataIndex: 'updatedAt',
        title: t('content.taxonomy.table.updatedAt'),
        width: 180,
        render: formatDateTime,
      },
      {
        key: 'actions',
        title: t('content.taxonomy.table.actions'),
        width: 160,
        render: (_, category) => (
          <div className="flex flex-wrap gap-2">
            <Button icon={<Pencil className="size-4" />} onClick={() => handleOpenEditCategory(category)} size="small">
              {t('content.taxonomy.edit')}
            </Button>
            <Button
              danger
              disabled={category.postCount > 0}
              icon={<Trash2 className="size-4" />}
              onClick={() => handleDeleteCategory(category)}
              size="small"
            >
              {t('content.taxonomy.delete')}
            </Button>
          </div>
        ),
      },
    ],
    [handleDeleteCategory, handleOpenEditCategory],
  )

  const tagColumns = useMemo<TableProps<Tag>['columns']>(
    () => [
      {
        dataIndex: 'name',
        title: t('content.taxonomy.table.tag'),
        render: (name: string, tag) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-fg">{name}</div>
            <div className="mt-1 truncate font-mono text-xs text-fg-muted">{tag.slug}</div>
          </div>
        ),
      },
      {
        dataIndex: 'postCount',
        title: t('content.taxonomy.table.postCount'),
        width: 90,
        render: (postCount: number) => <AntTag>{postCount}</AntTag>,
      },
      {
        dataIndex: 'updatedAt',
        title: t('content.taxonomy.table.updatedAt'),
        width: 180,
        render: formatDateTime,
      },
      {
        key: 'actions',
        title: t('content.taxonomy.table.actions'),
        width: 160,
        render: (_, tag) => (
          <div className="flex flex-wrap gap-2">
            <Button icon={<Pencil className="size-4" />} onClick={() => handleOpenEditTag(tag)} size="small">
              {t('content.taxonomy.edit')}
            </Button>
            <Button
              danger
              disabled={tag.postCount > 0}
              icon={<Trash2 className="size-4" />}
              onClick={() => handleDeleteTag(tag)}
              size="small"
            >
              {t('content.taxonomy.delete')}
            </Button>
          </div>
        ),
      },
    ],
    [handleDeleteTag, handleOpenEditTag],
  )

  const taxonomyTabs = useMemo<TabsProps['items']>(
    () => [
      {
        key: 'categories',
        label: <TaxonomyTabLabel count={filteredCategories.length} title={t('content.taxonomy.categories')} />,
        children: (
          <TaxonomyTabContent
            createText={t('content.taxonomy.createCategory')}
            keyword={categoryKeyword}
            onCreate={() => handleOpenCreate('category')}
            onKeywordChange={setCategoryKeyword}
            placeholder={t('content.taxonomy.categorySearchPlaceholder')}
          >
            {categoryLoadError ? (
              <div className="border-b border-border-subtle px-4 py-3 text-sm text-danger">{categoryLoadError}</div>
            ) : null}
            <Table<Category>
              columns={categoryColumns}
              dataSource={filteredCategories}
              loading={categoriesQuery.isLoading}
              locale={{ emptyText: t('content.taxonomy.categoryEmptyText') }}
              pagination={tablePagination}
              rowKey="id"
              scroll={{ x: 900 }}
            />
          </TaxonomyTabContent>
        ),
      },
      {
        key: 'tags',
        label: <TaxonomyTabLabel count={filteredTags.length} title={t('content.taxonomy.tags')} />,
        children: (
          <TaxonomyTabContent
            createText={t('content.taxonomy.createTag')}
            keyword={tagKeyword}
            onCreate={() => handleOpenCreate('tag')}
            onKeywordChange={setTagKeyword}
            placeholder={t('content.taxonomy.tagSearchPlaceholder')}
          >
            {tagLoadError ? (
              <div className="border-b border-border-subtle px-4 py-3 text-sm text-danger">{tagLoadError}</div>
            ) : null}
            <Table<Tag>
              columns={tagColumns}
              dataSource={filteredTags}
              loading={tagsQuery.isLoading}
              locale={{ emptyText: t('content.taxonomy.tagEmptyText') }}
              pagination={tablePagination}
              rowKey="id"
              scroll={{ x: 720 }}
            />
          </TaxonomyTabContent>
        ),
      },
    ],
    [
      categoriesQuery.isLoading,
      categoryColumns,
      categoryKeyword,
      categoryLoadError,
      filteredCategories,
      filteredTags,
      handleOpenCreate,
      tagColumns,
      tagKeyword,
      tagLoadError,
      tagsQuery.isLoading,
    ],
  )

  return (
    <div className="space-y-5">
      <FifaPageHeader
        title={t('content.taxonomy.title')}
        description={t('content.taxonomy.description')}
        actions={
          <Button
            icon={<RefreshCw className="size-4" />}
            loading={categoriesQuery.isFetching || tagsQuery.isFetching}
            onClick={() => {
              void categoriesQuery.refetch()
              void tagsQuery.refetch()
            }}
          >
            {t('content.taxonomy.refresh')}
          </Button>
        }
        summaryItems={summaryItems}
      />

      <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <Tabs
          className="[&_.ant-tabs-content-holder]:border-0 [&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav]:px-4 [&_.ant-tabs-nav]:pt-2"
          defaultActiveKey="categories"
          items={taxonomyTabs}
        />
      </section>

      <Modal
        confirmLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
        destroyOnHidden
        okText={t('content.taxonomy.save')}
        onCancel={() => {
          setCategoryDialog(emptyCategoryDialog)
          categoryForm.resetFields()
        }}
        onOk={() => void handleSaveCategory()}
        open={categoryDialog.open}
        title={categoryDialog.item ? t('content.taxonomy.editCategory') : t('content.taxonomy.createCategory')}
      >
        <Form<CategoryFormValue> form={categoryForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder={t('content.taxonomy.categoryNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true, message: '请输入 slug' }]}>
            <Input placeholder={t('content.taxonomy.categorySlugPlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder={t('content.taxonomy.categoryDescriptionPlaceholder')}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        confirmLoading={createTagMutation.isPending || updateTagMutation.isPending}
        destroyOnHidden
        okText={t('content.taxonomy.save')}
        onCancel={() => {
          setTagDialog(emptyTagDialog)
          tagForm.resetFields()
        }}
        onOk={() => void handleSaveTag()}
        open={tagDialog.open}
        title={tagDialog.item ? t('content.taxonomy.editTag') : t('content.taxonomy.createTag')}
      >
        <Form<TagFormValue> form={tagForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder={t('content.taxonomy.tagNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true, message: '请输入 slug' }]}>
            <Input placeholder={t('content.taxonomy.tagSlugPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

interface TaxonomyTabContentProps {
  createText: string
  keyword: string
  onCreate: () => void
  onKeywordChange: (value: string) => void
  placeholder: string
}

function TaxonomyTabContent({
  children,
  createText,
  keyword,
  onCreate,
  onKeywordChange,
  placeholder,
}: PropsWithChildren<TaxonomyTabContentProps>) {
  return (
    <div>
      <div className="grid gap-3 border-b border-border-subtle px-4 py-4 md:grid-cols-[minmax(240px,1fr)_auto]">
        <Input
          allowClear
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder={placeholder}
          prefix={<Search className="size-4 text-fg-muted" />}
          value={keyword}
        />
        <Button icon={<FilePlus2 className="size-4" />} onClick={onCreate} type="primary">
          {createText}
        </Button>
      </div>
      {children}
    </div>
  )
}

interface TaxonomyTabLabelProps {
  count: number
  title: string
}

function TaxonomyTabLabel({ count, title }: TaxonomyTabLabelProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span>{title}</span>
      <AntTag className="m-0">{count}</AntTag>
    </span>
  )
}
