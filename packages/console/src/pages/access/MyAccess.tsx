import type { CurrentUserRoles, PermissionSummary } from '@console/modules/rbac'

import { PermissionSummaryList } from '@console/components/business'
import { useCurrentUserPermissionsQuery, useCurrentUserRolesQuery } from '@console/modules/rbac'

import { Empty, Spin, Tag } from 'antd'
import dayjs from 'dayjs'
import { UserRound } from 'lucide-react'
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
  const elevatedPermissionsCount = permissions.filter((permission) => permission.scope === 'all' || permission.resource === 'system').length

  const overviewStats = [
    {
      description: t('access.current.statDescriptions.roles'),
      label: t('access.current.stats.roles'),
      value: roles.length,
    },
    {
      description: t('access.current.statDescriptions.permissions'),
      label: t('access.current.stats.permissions'),
      value: permissions.length,
    },
    {
      description: t('access.current.statDescriptions.modules'),
      label: t('access.current.stats.modules'),
      value: coveredModulesCount,
    },
    {
      description: t('access.current.statDescriptions.elevated'),
      label: t('access.current.stats.elevated'),
      value: elevatedPermissionsCount,
    },
  ]

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
    <div className="flex flex-col gap-5">
      <section className="rounded-[28px] border border-border-subtle bg-surface/85 p-6 shadow-sm backdrop-blur-xs">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="max-w-2xl">
            <div className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">
              {t('access.current.overviewEyebrow')}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg">{t('access.current.overviewTitle')}</h1>
            <p className="mt-3 text-sm leading-7 text-fg-muted">{t('access.current.overviewDescription')}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {overviewStats.map((item) => (
              <article key={item.label} className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4">
                <div className="text-fg-muted text-xs">{item.label}</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight text-fg">{item.value}</div>
                <p className="mt-2 text-xs leading-6 text-fg-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(340px,0.96fr)_minmax(0,1.24fr)]">
        <section className="rounded-[28px] border border-border-subtle bg-surface/80 p-5 shadow-sm backdrop-blur-xs">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-fg">{t('access.current.rolesTitle')}</h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-fg-muted">{t('access.current.rolesDescription')}</p>
            </div>

            <span className="text-fg-muted text-sm">{t('access.current.roleCount', { count: roles.length })}</span>
          </div>

          <div className="mt-4 rounded-2xl border border-border-subtle bg-surface-muted/55 p-4">
            <div className="text-sm font-medium text-fg">{t('access.current.roleSourceNoteTitle')}</div>
            <p className="mt-2 text-sm leading-7 text-fg-muted">{t('access.current.roleSourceNoteDescription')}</p>
          </div>

          <div className="mt-4">
            {roles.length > 0
              ? (
                  <div className="space-y-4">
                    {roles.map((role) => {
                      const capabilityGroups = buildRoleCapabilityGroups(role)
                      const previewPermissions = role.permissions.slice(0, 3)
                      const extraPermissionCount = role.permissions.length - previewPermissions.length

                      return (
                        <article key={role.id} className="rounded-[24px] border border-border-subtle bg-overlay-0/20 p-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-primary/10 text-primary rounded-2xl p-2.5">
                              <UserRound className="size-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-medium text-fg">{role.displayName || role.name}</h3>
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

                              <p className="mt-2 text-sm leading-7 text-fg-muted">
                                {role.description || t('access.current.roleFallbackDescription')}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-border-subtle bg-surface/70 px-3 py-3">
                              <div className="text-fg-muted text-xs">{t('access.current.roleInternalName')}</div>
                              <div className="mt-1 break-all font-mono text-xs text-fg">{role.name}</div>
                            </div>

                            <div className="rounded-2xl border border-border-subtle bg-surface/70 px-3 py-3">
                              <div className="text-fg-muted text-xs">{t('access.current.roleAssignedAt')}</div>
                              <div className="mt-1 text-sm text-fg">{dayjs(role.assignedAt).format('YYYY-MM-DD HH:mm')}</div>
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl border border-border-subtle bg-surface/70 p-3">
                            <div>
                              <div className="text-fg-muted text-xs">{t('access.current.roleCapabilitiesLabel')}</div>
                              <div className="mt-1 text-sm font-medium text-fg">
                                {t('access.current.rolePermissionCount', { count: role.permissions.length })}
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {capabilityGroups.map((group) => (
                                <span
                                  key={`${role.id}-${group.resource}`}
                                  className="rounded-full border border-border-subtle bg-overlay-0/35 px-2.5 py-1 text-xs text-fg-muted"
                                >
                                  {group.label} {group.count}
                                </span>
                              ))}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {previewPermissions.map((permission) => (
                                <span
                                  key={`${role.id}-${permission.key}`}
                                  className="rounded-full border border-border-subtle bg-surface px-2.5 py-1 text-xs text-fg"
                                >
                                  {getPermissionTitle(permission)}
                                </span>
                              ))}
                              {extraPermissionCount > 0
                                ? (
                                    <span className="rounded-full border border-dashed border-border-subtle px-2.5 py-1 text-xs text-fg-muted">
                                      {t('access.current.rolePermissionMore', { count: extraPermissionCount })}
                                    </span>
                                  )
                                : null}
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )
              : <Empty description={t('access.empty.roles')} image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </div>
        </section>

        <section className="rounded-[28px] border border-border-subtle bg-surface/80 p-5 shadow-sm backdrop-blur-xs">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-fg">{t('access.current.permissionsTitle')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-fg-muted">{t('access.current.permissionsDescription')}</p>
            </div>

            <span className="text-fg-muted text-sm">{t('access.current.permissionCount', { count: permissions.length })}</span>
          </div>

          <div className="mt-4">
            {permissions.length > 0
              ? <PermissionSummaryList permissions={permissions} />
              : <Empty description={t('access.empty.permissions')} image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </div>
        </section>
      </div>
    </div>
  )
}
