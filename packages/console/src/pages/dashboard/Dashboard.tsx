import { canAccessConsolePath, createPermissionKeySet } from '@console/app/access/access-control'
import { useAuthStore } from '@console/modules/auth'
import { useCurrentUserPermissionsQuery, useCurrentUserRolesQuery } from '@console/modules/rbac'

import { useNavigate } from '@tanstack/react-router'
import { Permissions } from '@xdd-zone/nexus/rbac'
import { Skeleton } from 'antd'
import dayjs from 'dayjs'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type DashboardActionTarget = '/my-access' | '/profile' | '/roles' | '/users'

interface DashboardAction {
  available: boolean
  description: string
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

  const permissionKeys = createPermissionKeySet(permissions)
  const canReadAllUsers = permissionsReady && canAccessConsolePath('/users', permissionKeys)
  const canReadAllRoles = permissionsReady && canAccessConsolePath('/roles', permissionKeys)
  const canManageSystem = permissionsReady && permissionKeys.has(Permissions.SYSTEM.MANAGE)
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

  const summaryItems = [
    {
      label: t('dashboard.metrics.activeRoles'),
      value: formatLoadedMetricValue(rolesReady, roles.length),
    },
    {
      label: t('dashboard.metrics.permissionTotal'),
      value: formatLoadedMetricValue(permissionsReady, permissions.length),
    },
    {
      label: t('dashboard.metrics.coveredModules'),
      value: formatLoadedMetricValue(permissionsReady, coveredModulesCount),
    },
  ]

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
      available: true,
      description: t('dashboard.actions.access.description'),
      key: 'my-access',
      title: t('dashboard.actions.access.title'),
      to: '/my-access',
      value: permissionsReady
        ? t('dashboard.actions.access.value', {
            count: permissions.length,
          })
        : '...',
    },
    {
      available: true,
      description: t('dashboard.actions.profile.description'),
      key: 'profile',
      title: t('dashboard.actions.profile.title'),
      to: '/profile',
      value: resolveStatusLabel(user?.status),
    },
    {
      available: canReadAllUsers,
      description: canReadAllUsers
        ? t('dashboard.actions.users.description')
        : t('dashboard.actions.users.unavailableDescription'),
      key: 'users',
      title: t('dashboard.actions.users.title'),
      to: '/users',
      value: canReadAllUsers ? t('dashboard.visibility.available') : t('dashboard.visibility.unavailable'),
    },
    {
      available: canReadAllRoles,
      description: canReadAllRoles
        ? t('dashboard.actions.roles.description')
        : t('dashboard.actions.roles.unavailableDescription'),
      key: 'roles',
      title: t('dashboard.actions.roles.title'),
      to: '/roles',
      value: canReadAllRoles ? t('dashboard.visibility.available') : t('dashboard.visibility.unavailable'),
    },
  ]

  const primaryAction = canReadAllUsers ? '/users' : canReadAllRoles ? '/roles' : '/my-access'
  const primaryActionLabel = canReadAllUsers
    ? t('dashboard.primaryAction.users')
    : canReadAllRoles
      ? t('dashboard.primaryAction.roles')
      : t('dashboard.primaryAction.access')

  if (currentUserRolesQuery.isLoading || currentUserPermissionsQuery.isLoading) {
    return (
      <section className="rounded-3xl border border-border-subtle bg-surface/78 p-5 shadow-sm backdrop-blur-xs">
        <Skeleton active paragraph={{ rows: 6 }} title={{ width: '28%' }} />
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-border-subtle bg-surface/78 p-5 shadow-sm backdrop-blur-xs">
      <div className="flex flex-col gap-4 border-b border-border-subtle pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            {t('dashboard.title', {
              name: user?.name || user?.username || t('dashboard.defaultName'),
            })}
          </h1>
          <p className="text-fg-muted mt-1.5 text-sm">{t('dashboard.description')}</p>
        </div>

        <div className="flex flex-wrap gap-2 lg:max-w-[56%] lg:justify-end">
          {summaryItems.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-overlay-0/16 px-2.5 py-1 text-xs"
            >
              <span className="text-fg-muted">{item.label}</span>
              <span className="font-medium text-fg">{item.value}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-fg">{t('dashboard.actions.title')}</h2>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary"
              onClick={() => {
                void navigate({ to: primaryAction })
              }}
            >
              <span>{primaryActionLabel}</span>
              <ArrowRight className="size-4" />
            </button>
          </div>

          <div className="mt-3 grid gap-2.5 md:grid-cols-2">
            {actionItems.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={!item.available}
                className={[
                  'rounded-2xl border px-4 py-3 text-left transition-colors',
                  item.available
                    ? 'border-border-subtle bg-surface-subtle/18 hover:border-primary/35 hover:bg-surface-subtle/28'
                    : 'border-border-subtle bg-surface-subtle/12 opacity-70',
                ].join(' ')}
                onClick={() => {
                  if (!item.available) {
                    return
                  }

                  void navigate({ to: item.to })
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-fg">{item.title}</div>
                    <p className="text-fg-muted mt-1 text-xs leading-6">{item.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border-subtle bg-overlay-0/16 px-2 py-0.5 text-xs text-fg-muted">
                    {item.value}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-fg">{t('dashboard.account.title')}</h2>
          <div className="mt-3 space-y-2.5">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface-subtle/18 px-3.5 py-3"
              >
                <span className="text-sm text-fg-muted">{item.label}</span>
                <span className="text-right text-sm font-medium text-fg">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
