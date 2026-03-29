import { useAuthStore } from '@console/modules/auth'
import { useCurrentUserPermissionsQuery, useCurrentUserRolesQuery, useRoleListQuery } from '@console/modules/rbac'
import { useUserListQuery } from '@console/modules/user'

import { useNavigate } from '@tanstack/react-router'
import { Button, Empty, Skeleton } from 'antd'
import dayjs from 'dayjs'
import {
  ArrowRight,
  Clock3,
  Fingerprint,
  KeyRound,
  Layers3,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface DashboardMetric {
  label: string
  value: string
}

interface DashboardAction {
  description: string
  icon: typeof Users
  key: string
  title: string
  to: '/my-access' | '/profile' | '/roles' | '/users'
  value: string
}

interface DashboardStatusItem {
  label: string
  value: string
}

function formatMetricValue(value?: number) {
  return typeof value === 'number' ? String(value) : '—'
}

/**
 * 仪表盘页面。
 */
export function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const session = useAuthStore((state) => state.session)

  const userListQuery = useUserListQuery({ page: 1, pageSize: 8 })
  const roleListQuery = useRoleListQuery({ page: 1, pageSize: 8 })
  const currentUserRolesQuery = useCurrentUserRolesQuery()
  const currentUserPermissionsQuery = useCurrentUserPermissionsQuery()

  const roles = currentUserRolesQuery.data?.roles ?? []
  const permissions = currentUserPermissionsQuery.data?.permissions ?? []
  const coveredModulesCount = new Set(permissions.map((permission) => permission.resource)).size
  const elevatedPermissionsCount = permissions.filter((permission) => permission.scope === 'all' || permission.resource === 'system').length

  const resolveStatusLabel = (status: string | null | undefined) => {
    if (!status) {
      return t('dashboard.account.fallback')
    }

    return t(`user.status.${status.toLowerCase()}`, {
      defaultValue: status,
    })
  }

  const metricItems: DashboardMetric[] = [
    {
      label: t('dashboard.metrics.userTotal'),
      value: formatMetricValue(userListQuery.data?.total),
    },
    {
      label: t('dashboard.metrics.roleTotal'),
      value: formatMetricValue(roleListQuery.data?.total),
    },
    {
      label: t('dashboard.metrics.permissionTotal'),
      value: formatMetricValue(permissions.length),
    },
    {
      label: t('dashboard.metrics.coveredModules'),
      value: formatMetricValue(coveredModulesCount),
    },
  ]

  const actionItems: DashboardAction[] = [
    {
      description: t('dashboard.actions.users.description'),
      icon: Users,
      key: 'users',
      title: t('dashboard.actions.users.title'),
      to: '/users',
      value: t('dashboard.actions.users.value', {
        count: userListQuery.data?.total ?? 0,
      }),
    },
    {
      description: t('dashboard.actions.roles.description'),
      icon: ShieldCheck,
      key: 'roles',
      title: t('dashboard.actions.roles.title'),
      to: '/roles',
      value: t('dashboard.actions.roles.value', {
        count: roleListQuery.data?.total ?? 0,
      }),
    },
    {
      description: t('dashboard.actions.access.description'),
      icon: KeyRound,
      key: 'my-access',
      title: t('dashboard.actions.access.title'),
      to: '/my-access',
      value: t('dashboard.actions.access.value', {
        count: permissions.length,
      }),
    },
    {
      description: t('dashboard.actions.profile.description'),
      icon: UserRound,
      key: 'profile',
      title: t('dashboard.actions.profile.title'),
      to: '/profile',
      value: user?.name || user?.email || t('dashboard.account.fallback'),
    },
  ]

  const accountItems: DashboardStatusItem[] = [
    {
      label: t('dashboard.account.items.currentUser'),
      value: user?.name || user?.email || t('dashboard.account.fallback'),
    },
    {
      label: t('dashboard.account.items.status'),
      value: resolveStatusLabel(user?.status),
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

  const flowItems = [
    {
      description: t('dashboard.flow.steps.users.description'),
      title: t('dashboard.flow.steps.users.title'),
    },
    {
      description: t('dashboard.flow.steps.roles.description'),
      title: t('dashboard.flow.steps.roles.title'),
    },
    {
      description: t('dashboard.flow.steps.permissions.description'),
      title: t('dashboard.flow.steps.permissions.title'),
    },
  ]

  const summaryUserTotal = formatMetricValue(userListQuery.data?.total)
  const summaryRoleTotal = formatMetricValue(roleListQuery.data?.total)
  const summaryRoleCount = formatMetricValue(roles.length)
  const summaryPermissionCount = formatMetricValue(permissions.length)

  return (
    <>
      <style>{`
        @keyframes dashboard-enter {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
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

      <div className="dashboard-page-enter flex flex-col gap-6">
        <section
          className="rounded-[28px] border border-border-subtle bg-surface/84 p-[clamp(20px,3vw,32px)] shadow-sm backdrop-blur-xs"
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.78fr)]">
            <div className="flex flex-col gap-6">
              <div className="max-w-4xl">
                <div className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">
                  {t('dashboard.eyebrow')}
                </div>
                <h1 className="mt-3 text-[clamp(2rem,3vw,3.2rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-fg">
                  {t('dashboard.title', {
                    name: user?.name || user?.username || t('dashboard.defaultName'),
                  })}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-fg-muted md:text-[15px]">
                  {t('dashboard.description')}
                </p>
                <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-fg md:text-[15px]">
                  {t('dashboard.summary', {
                    permissionCount: summaryPermissionCount,
                    roleCount: summaryRoleCount,
                    roleTotal: summaryRoleTotal,
                    userTotal: summaryUserTotal,
                  })}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metricItems.map((item) => (
                  <article
                    key={item.label}
                    className="rounded-2xl border border-border-subtle bg-surface-muted/58 px-4 py-4"
                  >
                    <div className="text-fg-muted text-xs tracking-[0.08em] uppercase">{item.label}</div>
                    <div className="mt-3 text-2xl font-semibold tracking-tight text-fg">{item.value}</div>
                  </article>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="primary"
                  size="large"
                  icon={<Users className="size-4" />}
                  onClick={() => void navigate({ to: '/users' })}
                >
                  {t('dashboard.primaryAction')}
                </Button>
                <Button
                  size="large"
                  icon={<KeyRound className="size-4" />}
                  onClick={() => void navigate({ to: '/my-access' })}
                >
                  {t('dashboard.secondaryAction')}
                </Button>
              </div>
            </div>

            <aside className="rounded-[24px] border border-border-subtle bg-surface-muted/60 p-5">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
                  <Fingerprint className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-fg">{t('dashboard.account.title')}</h2>
                  <p className="mt-2 text-sm leading-7 text-fg-muted">{t('dashboard.account.description')}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {accountItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface/55 px-4 py-3"
                  >
                    <span className="text-sm text-fg-muted">{item.label}</span>
                    <span className="text-right text-sm font-medium text-fg">{item.value}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.06fr)_minmax(320px,0.94fr)]">
          <section
            className="rounded-[28px] border border-border-subtle bg-surface/80 p-[clamp(18px,2.4vw,28px)] shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
                <Users className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-fg">{t('dashboard.actions.title')}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-fg-muted">{t('dashboard.actions.description')}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {actionItems.map((item) => {
                const ActionIcon = item.icon

                return (
                  <button
                    key={item.key}
                    type="button"
                    className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface-muted/58 px-4 py-4 text-left transition-colors duration-200 hover:border-primary/35 hover:bg-surface-muted/70"
                    onClick={() => void navigate({ to: item.to })}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="bg-primary/10 text-primary mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl">
                        <ActionIcon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-medium text-fg">{item.title}</h3>
                          <span className="rounded-full border border-border-subtle bg-surface/60 px-2.5 py-1 text-xs text-fg-muted">
                            {item.value}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-fg-muted">{item.description}</p>
                      </div>
                    </div>

                    <ArrowRight className="text-fg-muted size-4 shrink-0 transition-colors duration-200 group-hover:text-fg" />
                  </button>
                )
              })}
            </div>
          </section>

          <section
            className="rounded-[28px] border border-border-subtle bg-surface/80 p-[clamp(18px,2.4vw,28px)] shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
                <Layers3 className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-fg">{t('dashboard.coverage.title')}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-fg-muted">{t('dashboard.coverage.description')}</p>
              </div>
            </div>

            <div className="mt-5">
              {currentUserPermissionsQuery.isLoading
                ? (
                    <div className="space-y-3">
                      <Skeleton active paragraph={{ rows: 2 }} title={false} />
                      <Skeleton active paragraph={{ rows: 2 }} title={false} />
                    </div>
                  )
                : permissionGroups.length > 0
                  ? (
                      <div className="space-y-3">
                        {permissionGroups.map((group) => (
                          <article
                            key={group.resource}
                            className="rounded-2xl border border-border-subtle bg-surface-muted/58 px-4 py-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="text-base font-medium text-fg">{group.label}</h3>
                                <p className="mt-2 text-sm leading-7 text-fg-muted">{group.description}</p>
                              </div>
                              <span className="rounded-full border border-border-subtle bg-surface/60 px-2.5 py-1 text-xs text-fg-muted">
                                {t('access.permissionMeta.groupCount', { count: group.permissions.length })}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {group.permissions.slice(0, 3).map((permission) => (
                                <span
                                  key={permission.key}
                                  className="rounded-full border border-border-subtle bg-surface/60 px-2.5 py-1 text-xs text-fg"
                                >
                                  {t(`access.permissionMeta.titles.${permission.key}`, {
                                    defaultValue: permission.displayName || permission.key,
                                  })}
                                </span>
                              ))}
                              {group.permissions.length > 3
                                ? (
                                    <span className="rounded-full border border-dashed border-border-subtle px-2.5 py-1 text-xs text-fg-muted">
                                      {t('dashboard.coverage.more', {
                                        count: group.permissions.length - 3,
                                      })}
                                    </span>
                                  )
                                : null}
                            </div>
                          </article>
                        ))}
                      </div>
                    )
                  : <Empty description={t('dashboard.coverage.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            </div>
          </section>
        </div>

        <section
          className="rounded-[28px] border border-border-subtle bg-surface/78 p-[clamp(18px,2.4vw,28px)] shadow-sm"
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
            <div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
                  <Clock3 className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-fg">{t('dashboard.flow.title')}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-fg-muted">{t('dashboard.flow.description')}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {flowItems.map((item, index) => (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-border-subtle bg-surface-muted/58 px-4 py-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-primary flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-fg">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-fg-muted">{item.description}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-[24px] border border-border-subtle bg-surface-muted/60 p-5">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-fg">{t('dashboard.focus.title')}</h2>
                  <p className="mt-2 text-sm leading-7 text-fg-muted">{t('dashboard.focus.description')}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-border-subtle bg-surface/55 px-4 py-3">
                  <div className="text-sm text-fg-muted">{t('dashboard.focus.items.activeRoles')}</div>
                  <div className="mt-2 text-xl font-semibold tracking-tight text-fg">{roles.length}</div>
                </div>
                <div className="rounded-2xl border border-border-subtle bg-surface/55 px-4 py-3">
                  <div className="text-sm text-fg-muted">{t('dashboard.focus.items.elevatedPermissions')}</div>
                  <div className="mt-2 text-xl font-semibold tracking-tight text-fg">{elevatedPermissionsCount}</div>
                </div>
                <div className="rounded-2xl border border-border-subtle bg-surface/55 px-4 py-3">
                  <div className="text-sm text-fg-muted">{t('dashboard.focus.items.lastRefresh')}</div>
                  <div className="mt-2 text-sm font-medium text-fg">{dayjs().format('YYYY-MM-DD HH:mm')}</div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </>
  )
}
