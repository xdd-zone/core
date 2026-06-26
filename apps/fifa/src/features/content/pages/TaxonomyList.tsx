import type {
  Category,
  CreateCategoryRequest,
  CreateTagRequest,
  Tag,
  UpdateCategoryRequest,
  UpdateTagRequest,
} from '@xdd-zone/contracts'
import type { TableProps } from 'antd'

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
import { Tag as AntTag, App, Button, Form, Input, Modal, Table } from 'antd'
import { FilePlus2, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

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
      { label: '分类', value: categories.length },
      { label: '标签', value: tags.length },
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

    message.success(categoryDialog.item ? '分类已保存' : '分类已创建')
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

    message.success(tagDialog.item ? '标签已保存' : '标签已创建')
    setTagDialog(emptyTagDialog)
    tagForm.resetFields()
  }, [createTagMutation, message, tagDialog.item, tagForm, updateTagMutation])

  const handleDeleteCategory = useCallback(
    (category: Category) => {
      modal.confirm({
        title: '删除分类',
        content: `确认删除 ${category.name}。已被文章使用的分类不能删除。`,
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          const response = await deleteCategoryMutation.mutateAsync(category.id)

          if (!response.ok) {
            message.error(response.error.message)
            return
          }

          message.success('分类已删除')
        },
      })
    },
    [deleteCategoryMutation, message, modal],
  )

  const handleDeleteTag = useCallback(
    (tag: Tag) => {
      modal.confirm({
        title: '删除标签',
        content: `确认删除 ${tag.name}。已被文章使用的标签不能删除。`,
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          const response = await deleteTagMutation.mutateAsync(tag.id)

          if (!response.ok) {
            message.error(response.error.message)
            return
          }

          message.success('标签已删除')
        },
      })
    },
    [deleteTagMutation, message, modal],
  )

  const categoryColumns = useMemo<TableProps<Category>['columns']>(
    () => [
      {
        dataIndex: 'name',
        title: '分类',
        render: (name: string, category) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-fg">{name}</div>
            <div className="mt-1 truncate font-mono text-xs text-fg-muted">{category.slug}</div>
          </div>
        ),
      },
      {
        dataIndex: 'description',
        title: '说明',
        render: (description: string | null) => description || '-',
      },
      {
        dataIndex: 'postCount',
        title: '文章',
        width: 90,
        render: (postCount: number) => <AntTag>{postCount}</AntTag>,
      },
      {
        dataIndex: 'updatedAt',
        title: '更新时间',
        width: 180,
        render: formatDateTime,
      },
      {
        key: 'actions',
        title: '操作',
        width: 160,
        render: (_, category) => (
          <div className="flex flex-wrap gap-2">
            <Button icon={<Pencil className="size-4" />} onClick={() => handleOpenEditCategory(category)} size="small">
              编辑
            </Button>
            <Button
              danger
              disabled={category.postCount > 0}
              icon={<Trash2 className="size-4" />}
              onClick={() => handleDeleteCategory(category)}
              size="small"
            >
              删除
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
        title: '标签',
        render: (name: string, tag) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-fg">{name}</div>
            <div className="mt-1 truncate font-mono text-xs text-fg-muted">{tag.slug}</div>
          </div>
        ),
      },
      {
        dataIndex: 'postCount',
        title: '文章',
        width: 90,
        render: (postCount: number) => <AntTag>{postCount}</AntTag>,
      },
      {
        dataIndex: 'updatedAt',
        title: '更新时间',
        width: 180,
        render: formatDateTime,
      },
      {
        key: 'actions',
        title: '操作',
        width: 160,
        render: (_, tag) => (
          <div className="flex flex-wrap gap-2">
            <Button icon={<Pencil className="size-4" />} onClick={() => handleOpenEditTag(tag)} size="small">
              编辑
            </Button>
            <Button
              danger
              disabled={tag.postCount > 0}
              icon={<Trash2 className="size-4" />}
              onClick={() => handleDeleteTag(tag)}
              size="small"
            >
              删除
            </Button>
          </div>
        ),
      },
    ],
    [handleDeleteTag, handleOpenEditTag],
  )

  return (
    <div className="space-y-5">
      <FifaPageHeader
        title="分类与标签"
        description="管理文章分类、标签和公开 slug。"
        actions={
          <Button
            icon={<RefreshCw className="size-4" />}
            loading={categoriesQuery.isFetching || tagsQuery.isFetching}
            onClick={() => {
              void categoriesQuery.refetch()
              void tagsQuery.refetch()
            }}
          >
            刷新
          </Button>
        }
        summaryItems={summaryItems}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
          <TaxonomyPanelHeader
            count={filteredCategories.length}
            keyword={categoryKeyword}
            onCreate={() => handleOpenCreate('category')}
            onKeywordChange={setCategoryKeyword}
            placeholder="搜索分类名称或 slug"
            title="分类"
          />
          {categoryLoadError ? (
            <div className="border-b border-border-subtle px-4 py-3 text-sm text-danger">{categoryLoadError}</div>
          ) : null}
          <Table<Category>
            columns={categoryColumns}
            dataSource={filteredCategories}
            loading={categoriesQuery.isLoading}
            locale={{ emptyText: '暂无分类' }}
            pagination={tablePagination}
            rowKey="id"
            scroll={{ x: 900 }}
          />
        </section>

        <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
          <TaxonomyPanelHeader
            count={filteredTags.length}
            keyword={tagKeyword}
            onCreate={() => handleOpenCreate('tag')}
            onKeywordChange={setTagKeyword}
            placeholder="搜索标签名称或 slug"
            title="标签"
          />
          {tagLoadError ? (
            <div className="border-b border-border-subtle px-4 py-3 text-sm text-danger">{tagLoadError}</div>
          ) : null}
          <Table<Tag>
            columns={tagColumns}
            dataSource={filteredTags}
            loading={tagsQuery.isLoading}
            locale={{ emptyText: '暂无标签' }}
            pagination={tablePagination}
            rowKey="id"
            scroll={{ x: 720 }}
          />
        </section>
      </div>

      <Modal
        confirmLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
        destroyOnHidden
        okText="保存"
        onCancel={() => {
          setCategoryDialog(emptyCategoryDialog)
          categoryForm.resetFields()
        }}
        onOk={() => void handleSaveCategory()}
        open={categoryDialog.open}
        title={categoryDialog.item ? '编辑分类' : '新建分类'}
      >
        <Form<CategoryFormValue> form={categoryForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="输入分类名称" />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true, message: '请输入 slug' }]}>
            <Input placeholder="例如 notes" />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} placeholder="输入说明，可留空" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        confirmLoading={createTagMutation.isPending || updateTagMutation.isPending}
        destroyOnHidden
        okText="保存"
        onCancel={() => {
          setTagDialog(emptyTagDialog)
          tagForm.resetFields()
        }}
        onOk={() => void handleSaveTag()}
        open={tagDialog.open}
        title={tagDialog.item ? '编辑标签' : '新建标签'}
      >
        <Form<TagFormValue> form={tagForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="输入标签名称" />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true, message: '请输入 slug' }]}>
            <Input placeholder="例如 react" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

interface TaxonomyPanelHeaderProps {
  count: number
  keyword: string
  onCreate: () => void
  onKeywordChange: (value: string) => void
  placeholder: string
  title: string
}

function TaxonomyPanelHeader({
  count,
  keyword,
  onCreate,
  onKeywordChange,
  placeholder,
  title,
}: TaxonomyPanelHeaderProps) {
  return (
    <div className="space-y-3 border-b border-border-subtle px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-fg">{title}</h2>
          <AntTag>{count}</AntTag>
        </div>
        <Button icon={<FilePlus2 className="size-4" />} onClick={onCreate} type="primary">
          新建
        </Button>
      </div>
      <Input
        allowClear
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder={placeholder}
        prefix={<Search className="size-4 text-fg-muted" />}
        value={keyword}
      />
    </div>
  )
}
