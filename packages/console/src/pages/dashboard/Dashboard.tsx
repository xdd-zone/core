import type { LucideIcon } from 'lucide-react'

import { useAuthStore } from '@console/modules/auth'
import { roleListQueryOptions, useCurrentUserPermissionsQuery, useCurrentUserRolesQuery } from '@console/modules/rbac'
import { userListQueryOptions } from '@console/modules/user'

import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Empty, Skeleton } from 'antd'
import dayjs from 'dayjs'
import { ArrowRight, KeyRound, ShieldCheck, UserRound, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type DashboardActionTarget = '/my-access' | '/profile' | '/roles' | '/users'

interface DashboardAction {
  available: boolean
  description: string
  icon: LucideIcon
  key: string
  title: string
  to: DashboardActionTarget
  value: string
}

interface DashboardInfoItem {
  label: string
  value: string
}

function formatMetricValue(value?: number) {
  return typeof value === 'number' ? String(value) : '—'
}

function formatLoadedMetricValue(isReady: boolean, value?: number) {
  return isReady ? formatMetricValue(value) : '...'
}

/**
 * 仪表盘页面。
 */
export function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const session = useAuthStore((state) => state.session)

  const currentUserRolesQuery = useCurrentUserRolesQuery()
  const currentUserPermissionsQuery = useCurrentUserPermissionsQuery()
  const roles = currentUserRolesQuery.data?.roles ?? []
  const permissions = currentUserPermissionsQuery.data?.permissions ?? []
  const rolesReady = currentUserRolesQuery.isSuccess
  const permissionsReady = currentUserPermissionsQuery.isSuccess
  const loadingMetricValue = '...'

  const permissionKeys = new Set(permissions.map((permission) => permission.key))
  const canReadAllUsers = permissionsReady && permissionKeys.has('user:read:all')
  const canReadAllRoles = permissionsReady && permissionKeys.has('role:read:all')
  const canManageSystem = permissionsReady && permissionKeys.has('system:manage')

  const userListQuery = useQuery({
    ...userListQueryOptions({ page: 1, pageSize: 8 }),
    enabled: currentUserPermissionsQuery.isSuccess && canReadAllUsers,
  })

  const roleListQuery = useQuery({
    ...roleListQueryOptions({ page: 1, pageSize: 8 }),
    enabled: currentUserPermissionsQuery.isSuccess && canReadAllRoles,
  })

  const coveredModulesCount = new Set(permissions.map((permission) => permission.resource)).size

  const resolveStatusLabel = (status: string | null | undefined) => {
    if (!status) {
      return t('dashboard.account.fallback')
    }

    return t(`user.status.${status.toLowerCase()}`, {
      defaultValue: status,
    })
  }

  const resolveScopeLabel = () => {
    if (!permissionsReady) {
      return t('dashboard.scope.loading')
    }

    if (canManageSystem || (canReadAllUsers && canReadAllRoles)) {
      return t('dashboard.scope.fullAdmin')
    }

    if (canReadAllUsers || canReadAllRoles) {
      return t('dashboard.scope.partialAdmin')
    }

    return t('dashboard.scope.selfService')
  }

  const summaryRoleCount = formatLoadedMetricValue(rolesReady, roles.length)
  const summaryPermissionCount = formatLoadedMetricValue(permissionsReady, permissions.length)
  const summaryModuleCount = formatLoadedMetricValue(permissionsReady, coveredModulesCount)

  const infoItems: DashboardInfoItem[] = [
    {
      label: t('dashboard.account.items.currentUser'),
      value: user?.name || user?.email || t('dashboard.account.fallback'),
    },
    {
      label: t('dashboard.account.items.status'),
      value: resolveStatusLabel(user?.status),
    },
    {
      label: t('dashboard.visibility.items.manageScope'),
      value: resolveScopeLabel(),
    },
    {
      label: t('dashboard.metrics.activeRoles'),
      value: summaryRoleCount,
    },
    {
      label: t('dashboard.metrics.permissionTotal'),
      value: summaryPermissionCount,
    },
    {
      label: t('dashboard.metrics.coveredModules'),
      value: summaryModuleCount,
    },
    {
      label: t('dashboard.account.items.lastLogin'),
      value: user?.lastLogin ? dayjs(user.lastLogin).format('YYYY-MM-DD HH:mm') : t('dashboard.account.fallback'),
    },
    {
      label: t('dashboard.account.items.sessionExpires'),
      value: session?.expiresAt ? dayjs(session.expiresAt).format('YYYY-MM-DD HH:mm') : t('dashboard.account.fallback'),
    },
  ]

  const actionItems: DashboardAction[] = [
    {
      available: canReadAllUsers,
      description: canReadAllUsers
        ? t('dashboard.actions.users.description')
        : t('dashboard.actions.users.unavailableDescription'),
      icon: Users,
      key: 'users',
      title: t('dashboard.actions.users.title'),
      to: '/users',
      value: canReadAllUsers
        ? userListQuery.isSuccess
          ? t('dashboard.actions.users.value', {
              count: userListQuery.data?.total ?? 0,
            })
          : loadingMetricValue
        : t('dashboard.actions.unavailable'),
    },
    {
      available: canReadAllRoles,
      description: canReadAllRoles
        ? t('dashboard.actions.roles.description')
        : t('dashboard.actions.roles.unavailableDescription'),
      icon: ShieldCheck,
      key: 'roles',
      title: t('dashboard.actions.roles.title'),
      to: '/roles',
      value: canReadAllRoles
        ? roleListQuery.isSuccess
          ? t('dashboard.actions.roles.value', {
              count: roleListQuery.data?.total ?? 0,
            })
          : loadingMetricValue
        : t('dashboard.actions.unavailable'),
    },
    {
      available: true,
      description: t('dashboard.actions.access.description'),
      icon: KeyRound,
      key: 'my-access',
      title: t('dashboard.actions.access.title'),
      to: '/my-access',
      value: permissionsReady
        ? t('dashboard.actions.access.value', {
            count: permissions.length,
          })
        : loadingMetricValue,
    },
    {
      available: true,
      description: t('dashboard.actions.profile.description'),
      icon: UserRound,
      key: 'profile',
      title: t('dashboard.actions.profile.title'),
      to: '/profile',
      value: user?.name || user?.email || t('dashboard.account.fallback'),
    },
  ]

  const permissionGroups = Array.from(
    permissions.reduce((groupMap, permission) => {
      const currentGroup = groupMap.get(permission.resource) ?? []
      currentGroup.push(permission)
      groupMap.set(permission.resource, currentGroup)
      return groupMap
    }, new Map<string, typeof permissions>()),
  )
    .sort((left, right) => right[1].length - left[1].length || left[0].localeCompare(right[0]))
    .map(([resource, groupPermissions]) => ({
      description: t(`access.permissionMeta.groupDescriptions.${resource}`, {
        defaultValue: t('access.permissionMeta.groupDescriptions.other'),
      }),
      label: t(`access.permissionMeta.groups.${resource}`, {
        defaultValue: t('access.permissionMeta.groups.other'),
      }),
      permissions: groupPermissions,
      resource,
    }))

  return (
    <>
      <style>{`
        @keyframes dashboard-enter {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-page-enter {
            animation: none !important;
          }
        }

        .dashboard-page-enter {
          animation: dashboard-enter 220ms ease-out both;
        }
      `}</style>

      <div className="dashboard-page-enter">
        <section className="rounded-[28px] border border-border-subtle bg-surface/84 p-[clamp(20px,3vw,32px)] shadow-sm backdrop-blur-xs">
          <div className="max-w-4xl">
            <div className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">
              {t('dashboard.eyebrow')}
            </div>
            <h1 className="mt-3 text-[clamp(2rem,3vw,3rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-fg">
              {t('dashboard.title', {
                name: user?.name || user?.username || t('dashboard.defaultName'),
              })}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-fg-muted md:text-[15px]">
              {t('dashboard.description')}
            </p>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-fg md:text-[15px]">
              {t('dashboard.summary', {
                moduleCount: summaryModuleCount,
                permissionCount: summaryPermissionCount,
                roleCount: summaryRoleCount,
                scope: resolveScopeLabel(),
              })}
            </p>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-fg">{t('dashboard.account.title')}</h2>
                <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {infoItems.map((item) => (
                    <div key={item.label} className="border-border-subtle flex items-center justify-between gap-4 border-b py-2">
                      <span className="text-sm text-fg-muted">{item.label}</span>
                      <span className="text-right text-sm font-medium text-fg">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-base font-semibold text-fg">{t('dashboard.actions.title')}</h2>
                <div className="mt-4 space-y-2">
                  {actionItems.map((item) => {
                    const ActionIcon = item.icon

                    return (
                      <button
                        key={item.key}
                        type="button"
                        disabled={!item.available}
                        className={[
                          'flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-colors',
                          item.available
                            ? 'border-border-subtle bg-surface-muted/45 hover:border-primary/35 hover:bg-surface-muted/60'
                            : 'border-border-subtle bg-surface-muted/28 opacity-70',
                        ].join(' ')}
                        onClick={() => {
                          if (!item.available) {
                            return
                          }

                          void navigate({ to: item.to })
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-2xl">
                            <ActionIcon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-fg">{item.title}</span>
                              <span className="text-fg-muted text-xs">{item.value}</span>
                            </div>
                            <p className="text-fg-muted mt-1 text-xs leading-6">{item.description}</p>
                          </div>
                        </div>

                        {item.available ? <ArrowRight className="text-fg-muted size-4 shrink-0" /> : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-fg">{t('dashboard.roles.title')}</h2>
                <div className="mt-4">
                  {currentUserRolesQuery.isLoading ? (
                    <Skeleton active paragraph={{ rows: 2 }} title={false} />
                  ) : roles.length > 0 ? (
                    <div className="space-y-2">
                      {roles.map((role) => (
                        <div
                          key={role.id}
                          className="border-border-subtle flex flex-wrap items-center justify-between gap-3 border-b py-3"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-fg">
                                {role.displayName || role.name || t('dashboard.roles.fallbackTitle')}
                              </span>
                              <span className="text-fg-muted text-xs">
                                {t(`access.current.roleSource.${role.source}`, {
                                  defaultValue: role.source,
                                })}
                              </span>
                            </div>
                            <p className="text-fg-muted mt-1 text-xs leading-6">
                              {t('dashboard.roles.permissionCount', {
                                count: role.permissions.length,
                              })}
                            </p>
                          </div>
                          <span className="text-fg-muted text-xs">
                            {dayjs(role.assignedAt).format('YYYY-MM-DD HH:mm')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description={t('dashboard.roles.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-base font-semibold text-fg">{t('dashboard.coverage.title')}</h2>
                <div className="mt-4">
                  {currentUserPermissionsQuery.isLoading ? (
                    <Skeleton active paragraph={{ rows: 3 }} title={false} />
                  ) : permissionGroups.length > 0 ? (
                    <div className="space-y-3">
                      {permissionGroups.map((group) => (
                        <div key={group.resource} className="border-border-subtle border-b pb-3">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-medium text-fg">{group.label}</h3>
                            <span className="text-fg-muted text-xs">
                              {t('access.permissionMeta.groupCount', { count: group.permissions.length })}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {group.permissions.slice(0, 4).map((permission) => (
                              <span
                                key={permission.key}
                                className="rounded-full border border-border-subtle bg-surface/60 px-2.5 py-1 text-xs text-fg"
                              >
                                {t(`access.permissionMeta.titles.${permission.key}`, {
                                  defaultValue: permission.displayName || permission.key,
                                })}
                              </span>
                            ))}
                            {group.permissions.length > 4 ? (
                              <span className="text-fg-muted px-1 py-1 text-xs">
                                +{group.permissions.length - 4}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description={t('dashboard.coverage.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
