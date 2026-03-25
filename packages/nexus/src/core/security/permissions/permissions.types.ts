/**
 * 权限范围。
 */
export type PermissionScope = 'own' | 'all'

/**
 * 权限字符串。
 */
export type PermissionString = `${string}:${string}:${PermissionScope}` | `${string}:${string}`

/**
 * 权限对象。
 */
export interface Permission {
  resource: string
  action: string
  scope?: PermissionScope
}

/**
 * 权限上下文。
 */
export interface PermissionContext {
  permissions: Set<PermissionString>
  isSuperAdmin: boolean
  roles: Array<{
    id: string
    name: string
    displayName: string | null
  }>
}
