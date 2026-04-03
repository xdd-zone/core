import type { PermissionSummary } from '@console/modules/rbac'
import type { LucideIcon } from 'lucide-react'

import { Tag } from 'antd'
import { KeyRound, LockKeyhole, ShieldCheck, ShieldPlus, UserRound, UsersRound, Wrench } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface PermissionSummaryListProps {
  permissions: PermissionSummary[]
}

interface PermissionGroupMeta {
  icon: LucideIcon
  themeClassName: string
}

const RESOURCE_ORDER = ['user', 'role', 'user_role', 'user_permission', 'system'] as const

function getPermissionGroupMeta(resource: string): PermissionGroupMeta {
  switch (resource) {
    case 'user':
      return {
        icon: UserRound,
        themeClassName: 'bg-primary/10 text-primary',
      }
    case 'role':
      return {
        icon: UsersRound,
        themeClassName: 'bg-success/10 text-success',
      }
    case 'user_role':
      return {
        icon: ShieldPlus,
        themeClassName: 'bg-warning/10 text-warning',
      }
    case 'user_permission':
      return {
        icon: ShieldCheck,
        themeClassName: 'bg-info/10 text-info',
      }
    case 'system':
      return {
        icon: Wrench,
        themeClassName: 'bg-danger/10 text-danger',
      }
    default:
      return {
        icon: LockKeyhole,
        themeClassName: 'bg-surface-subtle text-fg-muted',
      }
  }
}

/**
 * 权限展示列表。
 */
export function PermissionSummaryList({ permissions }: PermissionSummaryListProps) {
  const { t } = useTranslation()

  const permissionGroups = useMemo(() => {
    const permissionGroupMap = new Map<string, PermissionSummary[]>()

    for (const permission of permissions) {
      const currentPermissions = permissionGroupMap.get(permission.resource) ?? []
      currentPermissions.push(permission)
      permissionGroupMap.set(permission.resource, currentPermissions)
    }

    const orderedResources = [
      ...RESOURCE_ORDER.filter((resource) => permissionGroupMap.has(resource)),
      ...Array.from(permissionGroupMap.keys())
        .filter((resource) => !RESOURCE_ORDER.includes(resource as (typeof RESOURCE_ORDER)[number]))
        .sort((left, right) => left.localeCompare(right)),
    ]

    return orderedResources.map((resource) => ({
      label: t(`access.permissionMeta.groups.${resource}`, {
        defaultValue: t('access.permissionMeta.groups.other'),
      }),
      meta: getPermissionGroupMeta(resource),
      permissions: permissionGroupMap.get(resource) ?? [],
      resource,
    }))
  }, [permissions, t])

  return (
    <div className="space-y-2.5">
      {permissionGroups.map((group) => {
        const GroupIcon = group.meta.icon

        return (
          <section key={group.resource} className="rounded-2xl border border-border-subtle bg-surface-subtle/20 p-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className={`rounded-xl p-2 ${group.meta.themeClassName}`}>
                  <GroupIcon className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium">{group.label}</div>
                </div>
              </div>

              <span className="text-fg-muted text-sm">
                {t('access.permissionMeta.groupCount', { count: group.permissions.length })}
              </span>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-border-subtle bg-overlay-0/18">
              {group.permissions.map((permission, index) => (
                <article
                  key={permission.key}
                  className={`px-3.5 py-2.5 ${index === 0 ? '' : 'border-t border-border-subtle'}`}
                >
                  <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        {t(`access.permissionMeta.titles.${permission.key}`, {
                          defaultValue: permission.displayName || permission.key,
                        })}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Tag variant="filled" className="m-0 rounded-full px-2 py-0.5 text-xs">
                        {t(`access.permissionMeta.scopes.${permission.scope ?? 'base'}`)}
                      </Tag>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface px-2.5 py-1 font-mono text-xs text-fg-muted">
                        <KeyRound className="size-3" />
                        {permission.key}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
