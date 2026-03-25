import type { PermissionString } from '../permissions'
import { ForbiddenError } from '@nexus/core/http'
import { PermissionService } from '../permissions/permission.service'

/**
 * 检查指定权限。
 */
export async function ensurePermission(userId: string, permission: PermissionString | string): Promise<void> {
  const hasPermission = await PermissionService.hasPermission(userId, permission)
  if (!hasPermission) {
    throw new ForbiddenError('权限不足')
  }
}
