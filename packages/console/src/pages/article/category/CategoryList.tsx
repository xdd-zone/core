import type { TableProps } from 'antd'

import { usePostListQuery } from '@console/modules/post'
import { Card, Empty, Input, Table, Tag } from 'antd'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { formatDateTime } from '../shared/content-utils'
import {
  ARTICLE_PAGE_CLASSNAME,
  ARTICLE_PANEL_BODY_STYLE,
  ARTICLE_PANEL_CLASSNAME,
  ARTICLE_TABLE_CLASSNAME,
} from '../shared/page-layout'

interface CategoryRow {
  draftCount: number
  examples: string[]
  name: string
  postCount: number
  publishedCount: number
  updatedAt: string | null
}

/**
 * 分类聚合页。
 */
export function CategoryList() {
  const { t } = useTranslation()
  const [keyword, setKeyword] = useState('')

  const postListQuery = usePostListQuery({
    page: 1,
    pageSize: 100,
  })

  const categoryRows = useMemo<CategoryRow[]>(() => {
    const map = new Map<string, CategoryRow>()

    for (const item of postListQuery.data?.items ?? []) {
      if (!item.category) {
        continue
      }

      const current = map.get(item.category) ?? {
        draftCount: 0,
        examples: [],
        name: item.category,
        postCount: 0,
        publishedCount: 0,
        updatedAt: null,
      }

      current.postCount += 1
      current.examples = [...current.examples, item.title].slice(0, 3)
      current.updatedAt =
        !current.updatedAt || new Date(item.updatedAt).getTime() > new Date(current.updatedAt).getTime()
          ? item.updatedAt
          : current.updatedAt

      if (item.status === 'published') {
        current.publishedCount += 1
      } else {
        current.draftCount += 1
      }

      map.set(item.category, current)
    }

    return Array.from(map.values())
      .filter((item) => !keyword || item.name.toLowerCase().includes(keyword.toLowerCase()))
      .sort((left, right) => right.postCount - left.postCount)
  }, [keyword, postListQuery.data?.items])

  const columns = useMemo<TableProps<CategoryRow>['columns']>(
    () => [
      {
        dataIndex: 'name',
        key: 'name',
        title: t('content.category.fields.name'),
        render: (value) => <span className="font-medium text-fg">{value}</span>,
      },
      {
        dataIndex: 'postCount',
        key: 'postCount',
        title: t('content.category.fields.postCount'),
      },
      {
        dataIndex: 'publishedCount',
        key: 'publishedCount',
        title: t('content.category.fields.publishedCount'),
      },
      {
        dataIndex: 'draftCount',
        key: 'draftCount',
        title: t('content.category.fields.draftCount'),
      },
      {
        dataIndex: 'examples',
        key: 'examples',
        title: t('content.category.fields.examples'),
        render: (value: string[]) =>
          value.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </div>
          ) : (
            '-'
          ),
      },
      {
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        title: t('content.category.fields.updatedAt'),
        render: (value) => formatDateTime(value),
      },
    ],
    [t],
  )

  return (
    <div className={ARTICLE_PAGE_CLASSNAME}>
      <section className="rounded-3xl border border-border-subtle bg-surface/72 px-4 py-4 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 max-w-2xl">
            <h1 className="text-fg text-xl font-semibold tracking-tight">{t('menu.categoryManagement')}</h1>
            <p className="text-fg-muted mt-1.5 text-sm">{t('content.category.description')}</p>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-[44%] xl:justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-overlay-0/16 px-2.5 py-1 text-xs">
              <span className="text-fg-muted">{t('content.category.summary.total')}</span>
              <span className="font-medium text-fg">{categoryRows.length}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-overlay-0/16 px-2.5 py-1 text-xs">
              <span className="text-fg-muted">{t('content.category.summary.sampled')}</span>
              <span className="font-medium text-fg">{postListQuery.data?.items.length ?? 0}</span>
            </span>
          </div>
        </div>
      </section>

      <Card
        className={ARTICLE_PANEL_CLASSNAME}
        styles={{ body: ARTICLE_PANEL_BODY_STYLE }}
        title={t('content.category.resultsTitle')}
      >
        <div className="flex flex-1 flex-col">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Input
              allowClear
              className="w-full max-w-md"
              placeholder={t('content.category.keywordPlaceholder')}
              prefix={<Search className="text-fg-muted size-4" />}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <span className="text-fg-muted text-sm">{t('content.category.aggregationHint')}</span>
          </div>

          {categoryRows.length > 0 ? (
            <Table
              className={ARTICLE_TABLE_CLASSNAME}
              columns={columns}
              dataSource={categoryRows}
              loading={postListQuery.isLoading}
              rowKey="name"
              pagination={false}
            />
          ) : (
            <Empty description={t('content.category.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </Card>
    </div>
  )
}
