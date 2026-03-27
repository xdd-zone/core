import { useCurrentUserPermissionsQuery, useCurrentUserRolesQuery } from '@console/modules/rbac'

import { Card, Empty, Spin, Tag } from 'antd'
import { ShieldCheck, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * 当前用户权限页面。
 */
export function MyAccess() {
  const { t } = useTranslation()

  const currentUserRolesQuery = useCurrentUserRolesQuery()
  const currentUserPermissionsQuery = useCurrentUserPermissionsQuery()

  if (currentUserRolesQuery.isLoading || currentUserPermissionsQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  const roles = currentUserRolesQuery.data?.roles ?? []
  const permissions = currentUserPermissionsQuery.data?.permissions ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card
          title={t('access.current.rolesTitle')}
          extra={<span className="text-fg-muted text-sm">{t('access.current.roleCount', { count: roles.length })}</span>}
        >
          {roles.length > 0
            ? (
                <div className="flex flex-col divide-y divide-border-subtle">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                      <div className="bg-primary/10 text-primary rounded-full p-2">
                        <UserRound className="size-4" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{role.displayName || role.name}</span>
                        <span className="text-fg-muted text-sm">{role.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            : <Empty description={t('access.empty.roles')} image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        </Card>

        <Card
          title={t('access.current.permissionsTitle')}
          extra={
            <span className="text-fg-muted text-sm">{t('access.current.permissionCount', { count: permissions.length })}</span>
          }
        >
          {permissions.length > 0
            ? (
                <div className="flex flex-wrap gap-2">
                  {permissions.map((permission) => (
                    <Tag key={permission} icon={<ShieldCheck className="size-3.5" />}>
                      {permission}
                    </Tag>
                  ))}
                </div>
              )
            : <Empty description={t('access.empty.permissions')} image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        </Card>
      </div>
    </div>
  )
}
