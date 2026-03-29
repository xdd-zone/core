import type { CurrentUserRoles, PermissionSummary } from '@console/modules/rbac'

import { PermissionSummaryList } from '@console/components/business'
import { useCurrentUserPermissionsQuery, useCurrentUserRolesQuery } from '@console/modules/rbac'

import { Empty, Spin, Tag } from 'antd'
import dayjs from 'dayjs'
import { KeyRound, ShieldCheck, UserRound } from 'lucide-react'
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
  const summaryItems = [
    { label: t('access.current.stats.roles'), value: roles.length },
    { label: t('access.current.stats.permissions'), value: permissions.length },
    { label: t('access.current.stats.modules'), value: coveredModulesCount },
    { label: t('access.current.stats.elevated'), value: elevatedPermissionsCount },
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
        <div className="flex flex-col gap-5">
          <div className="max-w-3xl">
            <div className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">
              {t('access.current.overviewEyebrow')}
            </div>
            <div className="mt-3 flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
                <KeyRound className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-fg">{t('access.current.overviewTitle')}</h1>
                <p className="mt-2 text-sm text-fg-muted">{t('access.current.overviewDescription')}</p>
                <p className="mt-3 text-sm font-medium text-fg">
                  {t('access.current.overviewSummary', {
                    elevated: elevatedPermissionsCount,
                    modules: coveredModulesCount,
                    permissions: permissions.length,
                    roles: roles.length,
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {summaryItems.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-overlay-0/20 px-3 py-1.5 text-sm"
              >
                <span className="text-fg-muted">{item.label}</span>
                <span className="font-medium text-fg">{item.value}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(340px,0.96fr)_minmax(0,1.24fr)]">
        <section className="rounded-[28px] border border-border-subtle bg-surface/80 p-5 shadow-sm backdrop-blur-xs">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-fg">{t('access.current.rolesTitle')}</h2>
              <p className="mt-2 max-w-xl text-sm text-fg-muted">{t('access.current.rolesDescription')}</p>
            </div>

            <span className="text-fg-muted text-sm">{t('access.current.roleCount', { count: roles.length })}</span>
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
                            <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-2xl">
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

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full border border-border-subtle bg-surface/70 px-2.5 py-1 font-mono text-xs text-fg-muted">
                              {role.name}
                            </span>
                            <span className="rounded-full border border-border-subtle bg-surface/70 px-2.5 py-1 text-xs text-fg-muted">
                              {t('access.current.roleAssignedAt')} {dayjs(role.assignedAt).format('YYYY-MM-DD HH:mm')}
                            </span>
                            <span className="rounded-full border border-border-subtle bg-surface/70 px-2.5 py-1 text-xs text-fg-muted">
                              {t('access.current.rolePermissionCount', { count: role.permissions.length })}
                            </span>
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
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-2xl">
                  <ShieldCheck className="size-4" />
                </div>
                <h2 className="text-lg font-semibold text-fg">{t('access.current.permissionsTitle')}</h2>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-fg-muted">{t('access.current.permissionsDescription')}</p>
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
