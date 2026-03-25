import type { PermissionString } from '@nexus/core/security/permissions'

/**
 * 角色与权限的聚合类型。
 */
export interface UserPermissionsResponse {
  permissions: PermissionString[]
  roles: Array<{
    id: string
    name: string
    displayName: string | null
  }>
}
