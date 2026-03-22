/**
 * 权限类型定义
 *
 * 格式: resource:action:scope
 * - resource: 资源名称 (如: user, role)
 * - action: 操作名称 (如: read, update, manage)
 * - scope: 数据范围 (own=本人, all=全部)
 */

export type PermissionScope = 'own' | 'all'

export type PermissionString = `${string}:${string}:${PermissionScope}` | `${string}:${string}`

export interface Permission {
  resource: string
  action: string
  scope?: PermissionScope
}

export interface PermissionContext {
  permissions: Set<PermissionString>
  isSuperAdmin: boolean
  roles: Array<{
    id: string
    name: string
    displayName: string | null
  }>
}
