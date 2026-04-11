import { canAccessConsolePath, createPermissionKeySet } from '@console/app/access/access-control'
import { ConsolePageHeader } from '@console/components/common/ConsolePageHeader'
import { useCurrentUserPermissionsQuery, useUserRolesQuery } from '@console/modules/rbac'
import { useUserDetailQuery } from '@console/modules/user'
import { ARTICLE_PAGE_CLASSNAME } from '@console/pages/article/shared/page-layout'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Badge, Button, Card, Descriptions, Empty, Spin } from 'antd'
import dayjs from 'dayjs'

import { ShieldCheck } from 'lucide-react'
import { useMemo } from 'react'
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
  const currentUserPermissionsQuery = useCurrentUserPermissionsQuery()
  const permissionKeys = useMemo(
    () => createPermissionKeySet(currentUserPermissionsQuery.data?.permissions),
    [currentUserPermissionsQuery.data?.permissions],
  )

  if (userQuery.isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!userQuery.data) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <span>{t('common.notFound')}</span>
      </div>
    )
  }

  const user = userQuery.data
  const roles = userRolesQuery.data || []
  const accessPath = `/users/${id}/access`
  const editPath = `/users/${id}/edit`

  const statusMap: Record<string, { color: string; text: string }> = {
    ACTIVE: { color: 'success', text: t('user.status.active') },
    INACTIVE: { color: 'default', text: t('user.status.inactive') },
    BANNED: { color: 'error', text: t('user.status.banned') },
  }
  const statusConfig = statusMap[user.status] || { color: 'default', text: user.status }
  const summaryItems = [
    { label: t('user.columns.status'), value: statusConfig.text },
    { label: t('user.columns.username'), value: user.username || t('user.detail.noUsername') },
    { label: t('user.columns.email'), value: user.email || t('user.detail.noEmail') },
    { label: t('user.detail.roles'), value: roles.length },
  ]

  return (
    <div className={ARTICLE_PAGE_CLASSNAME}>
      <ConsolePageHeader
        backLabel={t('common.back')}
        description={t('user.detail.description')}
        onBack={() => {
          void navigate({ to: '/users' })
        }}
        summaryItems={summaryItems}
        title={user.name}
        actions={
          <>
            {canAccessConsolePath(accessPath, permissionKeys) ? (
              <Button onClick={() => void navigate({ to: '/users/$id/access', params: { id } })}>
                {t('access.manage.title')}
              </Button>
            ) : null}
            {canAccessConsolePath(editPath, permissionKeys) ? (
              <Button type="primary" onClick={() => void navigate({ to: '/users/$id/edit', params: { id } })}>
                {t('common.edit')}
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <Card
          className="rounded-2xl"
          title={t('user.detail.title')}
          extra={
            <span className="text-fg-muted text-sm">
              {t('user.columns.updatedAt')} {dayjs(user.updatedAt).format('YYYY-MM-DD HH:mm')}
            </span>
          }
        >
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

        <div className="flex flex-col gap-5">
          <Card
            className="rounded-2xl"
            title={t('user.detail.roles')}
            extra={
              <span className="text-fg-muted text-sm">{t('access.manage.roleCount', { count: roles.length })}</span>
            }
            loading={userRolesQuery.isLoading}
          >
            {roles.length > 0 ? (
              <div className="flex flex-col divide-y divide-border-subtle">
                {roles.map((role) => (
                  <article key={role.roleId} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                    <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{role.roleDisplayName || role.roleName}</div>
                      <div className="text-fg-muted mt-1 text-sm">{role.roleName}</div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty description={t('user.detail.noRoles')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
