import type { PermissionString } from '../permissions'
import { ForbiddenError } from '@nexus/core/http'
import { PermissionService } from '../permissions/permission.service'

type RoutePermission = PermissionString | string

/**
 * own 权限配置。
 */
export interface OwnPermissionConfig {
  permission: RoutePermission
  paramKey?: string
}

/**
 * 标准化 own 权限配置。
 */
export function normalizeOwnPermission(input: OwnPermissionConfig | RoutePermission): Required<OwnPermissionConfig> {
  if (typeof input === 'string') {
    return {
      permission: input,
      paramKey: 'id',
    }
  }

  return {
    permission: input.permission,
    paramKey: input.paramKey ?? 'id',
  }
}

/**
 * 检查当前请求是否允许访问自己的资源。
 */
export async function ensureOwnPermission(
  userId: string,
  params: Record<string, string | undefined> | undefined,
  input: OwnPermissionConfig | RoutePermission,
): Promise<void> {
  const config = normalizeOwnPermission(input)
  const basePermission = config.permission.replace(/:(own|all)$/, '')
  const hasAllPermission = await PermissionService.hasPermission(userId, `${basePermission}:all`)

  if (hasAllPermission) {
    return
  }

  const isOwn = params?.[config.paramKey] === userId
  if (!isOwn) {
    throw new ForbiddenError('权限不足')
  }

  const hasOwnPermission = await PermissionService.hasPermission(userId, config.permission)
  if (!hasOwnPermission) {
    throw new ForbiddenError('权限不足')
  }
}
