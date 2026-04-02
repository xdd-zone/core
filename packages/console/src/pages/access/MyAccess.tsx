import type { CurrentUserRoles, PermissionSummary } from '@console/modules/rbac'

import { PermissionSummaryList } from '@console/components/business'
import { useCurrentUserPermissionsQuery, useCurrentUserRolesQuery } from '@console/modules/rbac'

import { Empty, Spin, Tag } from 'antd'
import dayjs from 'dayjs'
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
  const coveredModulesCount = new Set(permissions.map((permission) => permission.resource)).size
  const elevatedPermissionsCount = permissions.filter(
    (permission) => permission.scope === 'all' || permission.resource === 'system',
  ).length

  const getPermissionTitle = (permission: PermissionSummary) =>
    t(`access.permissionMeta.titles.${permission.key}`, {
      defaultValue: permission.displayName || permission.key,
    })

  const buildRoleCapabilityGroups = (role: CurrentUserRoles['roles'][number]) => {
    const groupCounts = new Map<string, number>()

    for (const permission of role.permissions) {
      groupCounts.set(permission.resource, (groupCounts.get(permission.resource) ?? 0) + 1)
    }

    return Array.from(groupCounts.entries()).map(([resource, count]) => ({
      count,
      label: t(`access.permissionMeta.groups.${resource}`, {
        defaultValue: t('access.permissionMeta.groups.other'),
      }),
      resource,
    }))
  }

  return (
    <section className="rounded-[28px] border border-border-subtle bg-surface/84 p-[clamp(20px,3vw,32px)] shadow-sm backdrop-blur-xs">
      <div className="max-w-4xl">
        <div className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">
          {t('access.current.overviewEyebrow')}
        </div>
        <h1 className="mt-3 text-[clamp(2rem,3vw,3rem)] font-semibold tracking-[-0.04em] text-fg">
          {t('access.current.overviewTitle')}
        </h1>
        <p className="mt-4 text-sm leading-7 text-fg-muted">{t('access.current.overviewDescription')}</p>
        <p className="mt-3 text-sm font-medium leading-7 text-fg">
          {t('access.current.overviewSummary', {
            elevated: elevatedPermissionsCount,
            modules: coveredModulesCount,
            permissions: permissions.length,
            roles: roles.length,
          })}
        </p>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.08fr)]">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-fg">{t('access.current.rolesTitle')}</h2>
            <span className="text-fg-muted text-sm">{t('access.current.roleCount', { count: roles.length })}</span>
          </div>

          <div className="mt-4">
            {roles.length > 0 ? (
              <div className="space-y-3">
                {roles.map((role) => {
                  const capabilityGroups = buildRoleCapabilityGroups(role)
                  const previewPermissions = role.permissions.slice(0, 3)
                  const extraPermissionCount = role.permissions.length - previewPermissions.length

                  return (
                    <div key={role.id} className="border-border-subtle border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-medium text-fg">{role.displayName || role.name}</h3>
                        <Tag bordered={false} className="m-0 rounded-full px-2.5 py-0.5 text-xs">
                          {t(`access.current.roleSource.${role.source}`)}
                        </Tag>
                        <Tag
                          bordered={false}
                          color={role.isSystem ? 'processing' : 'default'}
                          className="m-0 rounded-full px-2.5 py-0.5 text-xs"
                        >
                          {role.isSystem ? t('access.current.roleKind.system') : t('access.current.roleKind.custom')}
                        </Tag>
                      </div>

                      <div className="text-fg-muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        <span>{role.name}</span>
                        <span>{t('access.current.roleAssignedAt')} {dayjs(role.assignedAt).format('YYYY-MM-DD HH:mm')}</span>
                        <span>{t('access.current.rolePermissionCount', { count: role.permissions.length })}</span>
                      </div>

                      {capabilityGroups.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {capabilityGroups.map((group) => (
                            <span
                              key={`${role.id}-${group.resource}`}
                              className="rounded-full border border-border-subtle bg-overlay-0/20 px-2.5 py-1 text-xs text-fg-muted"
                            >
                              {group.label} {group.count}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {previewPermissions.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {previewPermissions.map((permission) => (
                            <span
                              key={`${role.id}-${permission.key}`}
                              className="rounded-full border border-border-subtle bg-surface/70 px-2.5 py-1 text-xs text-fg"
                            >
                              {getPermissionTitle(permission)}
                            </span>
                          ))}
                          {extraPermissionCount > 0 ? (
                            <span className="rounded-full border border-dashed border-border-subtle px-2.5 py-1 text-xs text-fg-muted">
                              {t('access.current.rolePermissionMore', { count: extraPermissionCount })}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : (
              <Empty description={t('access.empty.roles')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-fg">{t('access.current.permissionsTitle')}</h2>
            <span className="text-fg-muted text-sm">
              {t('access.current.permissionCount', { count: permissions.length })}
            </span>
          </div>

          <div className="mt-4">
            {permissions.length > 0 ? (
              <PermissionSummaryList permissions={permissions} />
            ) : (
              <Empty description={t('access.empty.permissions')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
