import type { PermissionSummary } from '@nexus/core/security/permissions'

/**
 * 角色与权限的聚合类型。
 */
export interface UserPermissionsResponse {
  permissions: PermissionSummary[]
  roles: Array<{
    id: string
    name: string
    displayName: string | null
  }>
}
