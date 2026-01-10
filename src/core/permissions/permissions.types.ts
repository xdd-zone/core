/**
 * 权限类型定义
 *
 * 格式: resource:action:scope
 * - resource: 资源名称 (如: article, user)
 * - action: 操作名称 (如: create, read, update, delete)
 * - scope: 数据范围 (own=本人, all=全部, 空=无范围限制等同于all)
 */

export type PermissionScope = 'own' | 'all' | ''

export type PermissionString = `${string}:${string}:${PermissionScope}` | `${string}:${string}` | '*'

export interface Permission {
  resource: string
  action: string
  scope?: PermissionScope
}

export interface PermissionContext {
  permissions: Set<string>
  roles: Array<{
    id: string
    name: string
    displayName: string | null
  }>
}
