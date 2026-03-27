import type { TableProps } from 'antd'

import { useRoleListQuery } from '@console/modules/rbac'

import { Input, Table, Tag } from 'antd'
import dayjs from 'dayjs'
import { Search } from 'lucide-react'
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
    <div className="flex flex-col gap-4">
      {/* 搜索过滤 */}
      <div className="flex items-center gap-4">
        <Input
          placeholder={t('role.searchPlaceholder')}
          prefix={<Search className="text-fg-muted size-4" />}
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value)
            setPage(1)
          }}
          className="w-64"
          allowClear
        />
      </div>

      {/* 角色列表 */}
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
    </div>
  )
}
