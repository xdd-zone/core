import { canAccessConsolePath, createPermissionKeySet } from '@console/app/access/access-control'
import { useAuthStore } from '@console/modules/auth'
import { usePostListQuery } from '@console/modules/post'
import { useCurrentUserPermissionsQuery, useCurrentUserRolesQuery } from '@console/modules/rbac'
import {
  ARTICLE_PAGE_CLASSNAME,
  ARTICLE_PANEL_BODY_STYLE,
  ARTICLE_PANEL_CLASSNAME,
} from '@console/pages/article/shared/page-layout'

import { useNavigate } from '@tanstack/react-router'
import { Permissions } from '@xdd-zone/nexus/permissions'
import { Card, Empty, Skeleton } from 'antd'
import dayjs from 'dayjs'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDateTime, renderPostStatus } from '../article/shared/content-utils'

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
  const canReadArticles = permissionsReady && canAccessConsolePath('/articles', permissionKeys)
  const canManageSystem = permissionsReady && permissionKeys.has(Permissions.SYSTEM.MANAGE)
  const coveredModulesCount = new Set(permissions.map((permission) => permission.resource)).size
  const recentPostListQuery = usePostListQuery(
    {
      page: 1,
      pageSize: 5,
    },
    canReadArticles,
  )
  const recentPosts = recentPostListQuery.data?.items ?? []

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

  if (currentUserRolesQuery.isLoading || currentUserPermissionsQuery.isLoading) {
    return (
      <div className={ARTICLE_PAGE_CLASSNAME}>
        <Card className={ARTICLE_PANEL_CLASSNAME} styles={{ body: ARTICLE_PANEL_BODY_STYLE }}>
          <Skeleton active paragraph={{ rows: 6 }} title={{ width: '28%' }} />
        </Card>
      </div>
    )
  }

  return (
    <div className={ARTICLE_PAGE_CLASSNAME}>
      <section className="rounded-2xl border border-border-subtle bg-surface/72 px-4 py-4 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 max-w-2xl">
            <h1 className="text-fg text-xl font-semibold tracking-tight">
              {t('dashboard.title', {
                name: user?.name || user?.username || t('dashboard.defaultName'),
              })}
            </h1>
            <p className="text-fg-muted mt-1.5 text-sm">{t('dashboard.description')}</p>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-[44%] xl:justify-end">
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
      </section>

      <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(280px,0.92fr)_minmax(0,1.08fr)]">
        <Card
          className={ARTICLE_PANEL_CLASSNAME}
          styles={{ body: ARTICLE_PANEL_BODY_STYLE }}
          title={t('dashboard.account.title')}
        >
          <div className="space-y-2.5">
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
        </Card>

        <Card
          className={ARTICLE_PANEL_CLASSNAME}
          styles={{ body: ARTICLE_PANEL_BODY_STYLE }}
          title={t('dashboard.recentPosts.title')}
          extra={
            canReadArticles ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                onClick={() => {
                  void navigate({ to: '/articles' })
                }}
              >
                <span>{t('dashboard.recentPosts.viewAll')}</span>
                <ArrowRight className="size-4" />
              </button>
            ) : null
          }
        >
          {!canReadArticles ? (
            <div className="flex flex-1 items-center justify-center py-8">
              <Empty description={t('dashboard.recentPosts.unavailable')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : recentPostListQuery.isLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} title={false} />
          ) : recentPosts.length > 0 ? (
            <div>
              {recentPosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  className="grid w-full gap-3 border-b border-border-subtle py-3 text-left transition-colors last:border-b-0 hover:bg-surface-subtle/12 md:grid-cols-[minmax(0,1fr)_auto]"
                  onClick={() => {
                    void navigate({ to: '/articles/$id', params: { id: post.id } })
                  }}
                >
                  <div className="min-w-0 px-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-fg">{post.title}</span>
                      {renderPostStatus(post.status, t)}
                    </div>
                    <div className="text-fg-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span>{post.category?.name ?? t('dashboard.recentPosts.noCategory')}</span>
                      <span>{post.slug}</span>
                    </div>
                  </div>
                  <div className="text-fg-muted flex items-center px-3 text-xs md:justify-end">
                    {formatDateTime(post.updatedAt)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center py-8">
              <Empty description={t('dashboard.recentPosts.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
