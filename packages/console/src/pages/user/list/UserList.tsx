import type { UserStatus } from '@console/modules/user'

import type { TableProps } from 'antd'

import { useUserListQuery } from '@console/modules/user'

import { useNavigate } from '@tanstack/react-router'
import { Badge, Button, Input, Select, Space, Table } from 'antd'
import dayjs from 'dayjs'
import { Search } from 'lucide-react'
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
    <div className="flex flex-col gap-4">
      {/* 搜索过滤 */}
      <div className="flex items-center gap-4">
        <Input
          placeholder={t('user.searchPlaceholder')}
          prefix={<Search className="text-fg-muted size-4" />}
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value)
            setPage(1)
          }}
          className="w-64"
          allowClear
        />
        <Select
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
          options={STATUS_OPTIONS.map((opt) => ({ label: t(opt.label), value: opt.value }))}
          className="w-40"
        />
      </div>

      {/* 用户列表 */}
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
    </div>
  )
}
