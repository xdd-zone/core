import type { UserStatus } from '@console/modules/user'

import type { TableProps } from 'antd'

import { canAccessConsolePath, createPermissionKeySet } from '@console/app/access/access-control'
import { useCurrentUserPermissionsQuery } from '@console/modules/rbac'
import { useUserListQuery } from '@console/modules/user'
import {
  ARTICLE_PAGE_CLASSNAME,
  ARTICLE_PANEL_BODY_STYLE,
  ARTICLE_PANEL_CLASSNAME,
  ARTICLE_TABLE_CLASSNAME,
} from '@console/pages/article/shared/page-layout'

import { useNavigate } from '@tanstack/react-router'
import { Badge, Button, Card, Input, Select, Space, Table } from 'antd'
import dayjs from 'dayjs'
import { RefreshCw, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

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
  const currentUserPermissionsQuery = useCurrentUserPermissionsQuery()
  const permissionKeys = useMemo(
    () => createPermissionKeySet(currentUserPermissionsQuery.data?.permissions),
    [currentUserPermissionsQuery.data?.permissions],
  )

  const userListQuery = useUserListQuery({
    keyword: keyword || undefined,
    page,
    pageSize,
    status: status || undefined,
  })

  const currentItems = userListQuery.data?.items ?? []
  const activeCount = currentItems.filter((user) => user.status === 'ACTIVE').length
  const currentPageCount = currentItems.length
  const canAccessDetail = useCallback(
    (id: string) => canAccessConsolePath(`/users/${id}`, permissionKeys),
    [permissionKeys],
  )
  const canAccessUserAccess = useCallback(
    (id: string) => canAccessConsolePath(`/users/${id}/access`, permissionKeys),
    [permissionKeys],
  )
  const canAccessEdit = useCallback(
    (id: string) => canAccessConsolePath(`/users/${id}/edit`, permissionKeys),
    [permissionKeys],
  )
  const summaryItems = [
    { label: t('user.list.stats.total'), value: userListQuery.data?.total ?? 0 },
    { label: t('user.list.stats.currentPage'), value: currentPageCount },
    { label: t('user.list.stats.active'), value: activeCount },
  ]

  const columns = useMemo<TableProps['columns']>(
    () => [
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
            {canAccessDetail(record.id) ? (
              <Button
                type="link"
                size="small"
                onClick={() => void navigate({ to: '/users/$id', params: { id: record.id } })}
              >
                {t('common.view')}
              </Button>
            ) : null}
            {canAccessUserAccess(record.id) ? (
              <Button
                type="link"
                size="small"
                onClick={() => void navigate({ to: '/users/$id/access', params: { id: record.id } })}
              >
                {t('access.manage.shortAction')}
              </Button>
            ) : null}
            {canAccessEdit(record.id) ? (
              <Button
                type="link"
                size="small"
                onClick={() => void navigate({ to: '/users/$id/edit', params: { id: record.id } })}
              >
                {t('common.edit')}
              </Button>
            ) : null}
          </Space>
        ),
      },
    ],
    [canAccessDetail, canAccessEdit, canAccessUserAccess, navigate, t],
  )

  return (
    <div className={ARTICLE_PAGE_CLASSNAME}>
      <section className="rounded-3xl border border-border-subtle bg-surface/72 px-4 py-4 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div>
              <h1 className="text-fg text-xl font-semibold tracking-tight">{t('menu.userManagement')}</h1>
              <p className="text-fg-muted mt-1.5 text-sm">{t('user.list.description')}</p>
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
        className={ARTICLE_PANEL_CLASSNAME}
        styles={{ body: ARTICLE_PANEL_BODY_STYLE }}
        title={t('user.list.resultsTitle')}
        extra={
          <span className="text-fg-muted text-sm">{t('common.total', { count: userListQuery.data?.total ?? 0 })}</span>
        }
      >
        <div className="flex flex-1 flex-col">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
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

          <Table
            className={ARTICLE_TABLE_CLASSNAME}
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
        </div>
      </Card>
    </div>
  )
}
