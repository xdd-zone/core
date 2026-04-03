import type { TableProps } from 'antd'

import { useRoleListQuery } from '@console/modules/rbac'

import { Button, Card, Input, Table, Tag } from 'antd'
import dayjs from 'dayjs'
import { RefreshCw, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * 角色列表页面
 */
export function RoleList() {
  const { t } = useTranslation()

  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const roleListQuery = useRoleListQuery({ keyword: keyword || undefined, page, pageSize })
  const currentItems = roleListQuery.data?.items ?? []
  const systemRolesCount = currentItems.filter((role) => role.isSystem).length
  const summaryItems = [
    { label: t('role.list.stats.total'), value: roleListQuery.data?.total ?? 0 },
    { label: t('role.list.stats.system'), value: systemRolesCount },
    { label: t('role.list.stats.currentPage'), value: currentItems.length },
  ]

  const columns: TableProps['columns'] = [
    {
      title: t('role.columns.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('role.columns.displayName'),
      dataIndex: 'displayName',
      key: 'displayName',
      render: (value: string) => value || '-',
    },
    {
      title: t('role.columns.description'),
      dataIndex: 'description',
      key: 'description',
      render: (value: string) => value || '-',
    },
    {
      title: t('role.columns.isSystem'),
      dataIndex: 'isSystem',
      key: 'isSystem',
      render: (isSystem: boolean) =>
        isSystem ? <Tag color="blue">{t('role.systemRole')}</Tag> : <Tag>{t('role.customRole')}</Tag>,
    },
    {
      title: t('role.columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl border border-border-subtle bg-surface/72 px-4 py-4 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{t('menu.roleManagement')}</h1>
              <p className="text-fg-muted mt-1.5 text-sm">{t('role.list.description')}</p>
            </div>
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
        title={t('role.list.resultsTitle')}
        extra={<span className="text-fg-muted text-sm">{t('common.total', { count: roleListQuery.data?.total ?? 0 })}</span>}
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            placeholder={t('role.searchPlaceholder')}
            prefix={<Search className="text-fg-muted size-4" />}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(1)
            }}
            className="w-full max-w-md"
            allowClear
          />

          <Button
            icon={<RefreshCw className="size-4" />}
            onClick={() => {
              setKeyword('')
              setPage(1)
              setPageSize(20)
            }}
          >
            {t('role.list.resetFilters')}
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={roleListQuery.data?.items}
          rowKey="id"
          loading={roleListQuery.isLoading}
          pagination={{
            current: page,
            pageSize,
            total: roleListQuery.data?.total,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => t('common.total', { count: total }),
          }}
        />
      </Card>
    </div>
  )
}
