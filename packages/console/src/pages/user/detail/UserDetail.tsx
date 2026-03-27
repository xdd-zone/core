import { useUserRolesQuery } from '@console/modules/rbac'

import { useUserDetailQuery } from '@console/modules/user'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Badge, Button, Card, Descriptions, Space, Spin } from 'antd'
import dayjs from 'dayjs'

import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * 用户详情页面
 */
export function UserDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams({ from: '/protected/app-layout/users/$id' })

  const userQuery = useUserDetailQuery(id)
  const userRolesQuery = useUserRolesQuery(id)

  if (userQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!userQuery.data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span>{t('common.notFound')}</span>
      </div>
    )
  }

  const user = userQuery.data
  const roles = userRolesQuery.data || []

  const statusMap: Record<string, { color: string; text: string }> = {
    ACTIVE: { color: 'success', text: t('user.status.active') },
    INACTIVE: { color: 'default', text: t('user.status.inactive') },
    BANNED: { color: 'error', text: t('user.status.banned') },
  }
  const statusConfig = statusMap[user.status] || { color: 'default', text: user.status }

  return (
    <div className="flex flex-col gap-4">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <Button icon={<ArrowLeft className="size-4" />} onClick={() => void navigate({ to: '/users' })}>
          {t('common.back')}
        </Button>
        <Space>
          <Button onClick={() => void navigate({ to: '/users/$id/access', params: { id } })}>
            {t('access.manage.title')}
          </Button>
          <Button type="primary" onClick={() => void navigate({ to: '/users/$id/edit', params: { id } })}>
            {t('common.edit')}
          </Button>
        </Space>
      </div>

      {/* 用户信息卡片 */}
      <Card title={t('user.detail.title')}>
        <Descriptions column={2}>
          <Descriptions.Item label={t('user.columns.username')}>{user.username || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('user.columns.name')}>{user.name}</Descriptions.Item>
          <Descriptions.Item label={t('user.columns.email')}>{user.email || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('user.columns.phone')}>{user.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('user.columns.status')}>
            <Badge status={statusConfig.color as 'success' | 'default' | 'error'} text={statusConfig.text} />
          </Descriptions.Item>
          <Descriptions.Item label={t('user.columns.introduce')}>{user.introduce || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('user.columns.lastLogin')}>
            {user.lastLogin ? dayjs(user.lastLogin).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('user.columns.lastLoginIp')}>{user.lastLoginIp || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('user.columns.createdAt')}>
            {dayjs(user.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label={t('user.columns.updatedAt')}>
            {dayjs(user.updatedAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 用户角色卡片 */}
      <Card title={t('user.detail.roles')} loading={userRolesQuery.isLoading}>
        {roles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <span key={role.roleId} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                {role.roleDisplayName || role.roleName}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-fg-muted">{t('user.detail.noRoles')}</span>
        )}
      </Card>
    </div>
  )
}
