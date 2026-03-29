import type { UserStatus } from '@console/modules/user'

import type { TableProps } from 'antd'

import { useUserListQuery } from '@console/modules/user'

import { useNavigate } from '@tanstack/react-router'
import { Badge, Button, Card, Input, Select, Space, Table } from 'antd'
import dayjs from 'dayjs'
import { RefreshCw, Search, Users } from 'lucide-react'
import { useState } from 'react'

import { useTranslation } from 'react-i18next'

const STATUS_OPTIONS = [
  { label: 'user.status.all', value: '' },
  { label: 'user.status.active', value: 'ACTIVE' },
  { label: 'user.status.inactive', value: 'INACTIVE' },
  { label: 'user.status.banned', value: 'BANNED' },
] as const

/**
 * 用户列表页面
 */
export function UserList() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [status, setStatus] = useState<UserStatus | ''>('')

  const userListQuery = useUserListQuery({
    keyword: keyword || undefined,
    page,
    pageSize,
    status: status || undefined,
  })

  const currentItems = userListQuery.data?.items ?? []
  const activeCount = currentItems.filter((user) => user.status === 'ACTIVE').length
  const currentPageCount = currentItems.length

  const columns: TableProps['columns'] = [
    {
      title: t('user.columns.username'),
      dataIndex: 'username',
      key: 'username',
      render: (value) => value || '-',
    },
    {
      title: t('user.columns.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('user.columns.email'),
      dataIndex: 'email',
      key: 'email',
      render: (value) => value || '-',
    },
    {
      title: t('user.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          ACTIVE: { color: 'success', text: t('user.status.active') },
          INACTIVE: { color: 'default', text: t('user.status.inactive') },
          BANNED: { color: 'error', text: t('user.status.banned') },
        }
        const config = statusMap[status] || { color: 'default', text: status }
        return <Badge status={config.color as 'success' | 'default' | 'error'} text={config.text} />
      },
    },
    {
      title: t('user.columns.lastLogin'),
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (value: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: t('user.columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => void navigate({ to: '/users/$id', params: { id: record.id } })}
          >
            {t('common.view')}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => void navigate({ to: '/users/$id/access', params: { id: record.id } })}
          >
            {t('access.manage.shortAction')}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => void navigate({ to: '/users/$id/edit', params: { id: record.id } })}
          >
            {t('common.edit')}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[28px] border border-border-subtle bg-surface/85 p-6 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">
                {t('user.list.eyebrow')}
              </div>
              <div className="mt-3 flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
                  <Users className="size-5" />
                </div>
                <div>
                  <h1 className="text-fg text-2xl font-semibold tracking-tight">{t('menu.userManagement')}</h1>
                  <p className="text-fg-muted mt-2 text-sm leading-7">{t('user.list.description')}</p>
                </div>
              </div>
            </div>

            <Button
              icon={<RefreshCw className="size-4" />}
              onClick={() => {
                setKeyword('')
                setStatus('')
                setPage(1)
                setPageSize(20)
              }}
            >
              {t('user.list.resetFilters')}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <article className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4">
              <div className="text-fg-muted text-xs">{t('user.list.stats.total')}</div>
              <div className="mt-2 text-2xl font-semibold">{userListQuery.data?.total ?? 0}</div>
              <p className="text-fg-muted mt-2 text-xs leading-6">{t('user.list.stats.totalDescription')}</p>
            </article>
            <article className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4">
              <div className="text-fg-muted text-xs">{t('user.list.stats.currentPage')}</div>
              <div className="mt-2 text-2xl font-semibold">{currentPageCount}</div>
              <p className="text-fg-muted mt-2 text-xs leading-6">{t('user.list.stats.currentPageDescription')}</p>
            </article>
            <article className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4">
              <div className="text-fg-muted text-xs">{t('user.list.stats.active')}</div>
              <div className="mt-2 text-2xl font-semibold">{activeCount}</div>
              <p className="text-fg-muted mt-2 text-xs leading-6">{t('user.list.stats.activeDescription')}</p>
            </article>
          </div>
        </div>
      </section>

      <Card
        title={t('user.list.filtersTitle')}
        extra={<span className="text-fg-muted text-sm">{t('user.list.filtersDescription')}</span>}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Input
            placeholder={t('user.searchPlaceholder')}
            prefix={<Search className="text-fg-muted size-4" />}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(1)
            }}
            className="min-w-0 lg:w-80"
            allowClear
          />
          <Select
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={STATUS_OPTIONS.map((opt) => ({ label: t(opt.label), value: opt.value }))}
            className="w-full lg:w-48"
          />
        </div>
      </Card>

      <Card
        title={t('user.list.resultsTitle')}
        extra={
          <span className="text-fg-muted text-sm">{t('common.total', { count: userListQuery.data?.total ?? 0 })}</span>
        }
      >
        <div className="mb-4 rounded-2xl border border-border-subtle bg-surface-subtle/35 px-4 py-3 text-sm text-fg-muted">
          {t('user.list.resultsDescription')}
        </div>
        <Table
          columns={columns}
          dataSource={userListQuery.data?.items}
          rowKey="id"
          loading={userListQuery.isLoading}
          pagination={{
            current: page,
            pageSize,
            total: userListQuery.data?.total,
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
