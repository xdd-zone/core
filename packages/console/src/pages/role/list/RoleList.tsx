import type { TableProps } from 'antd'

import { useRoleListQuery } from '@console/modules/rbac'

import { Button, Card, Input, Table, Tag } from 'antd'
import dayjs from 'dayjs'
import { RefreshCw, Search, ShieldCheck } from 'lucide-react'
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
      <section className="rounded-[28px] border border-border-subtle bg-surface/85 p-6 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">
                {t('role.list.eyebrow')}
              </div>
              <div className="mt-3 flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">{t('menu.roleManagement')}</h1>
                  <p className="text-fg-muted mt-2 text-sm leading-7">{t('role.list.description')}</p>
                </div>
              </div>
            </div>

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

          <div className="grid gap-3 md:grid-cols-3">
            <article className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4">
              <div className="text-fg-muted text-xs">{t('role.list.stats.total')}</div>
              <div className="mt-2 text-2xl font-semibold">{roleListQuery.data?.total ?? 0}</div>
              <p className="text-fg-muted mt-2 text-xs leading-6">{t('role.list.stats.totalDescription')}</p>
            </article>
            <article className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4">
              <div className="text-fg-muted text-xs">{t('role.list.stats.system')}</div>
              <div className="mt-2 text-2xl font-semibold">{systemRolesCount}</div>
              <p className="text-fg-muted mt-2 text-xs leading-6">{t('role.list.stats.systemDescription')}</p>
            </article>
            <article className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4">
              <div className="text-fg-muted text-xs">{t('role.list.stats.currentPage')}</div>
              <div className="mt-2 text-2xl font-semibold">{currentItems.length}</div>
              <p className="text-fg-muted mt-2 text-xs leading-6">{t('role.list.stats.currentPageDescription')}</p>
            </article>
          </div>
        </div>
      </section>

      <Card title={t('role.list.filtersTitle')} extra={<span className="text-fg-muted text-sm">{t('role.list.filtersDescription')}</span>}>
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
      </Card>

      <Card
        title={t('role.list.resultsTitle')}
        extra={<span className="text-fg-muted text-sm">{t('common.total', { count: roleListQuery.data?.total ?? 0 })}</span>}
      >
        <div className="mb-4 rounded-2xl border border-border-subtle bg-surface-subtle/35 px-4 py-3 text-sm text-fg-muted">
          {t('role.list.resultsDescription')}
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
