import type { Permission, PermissionScope, PermissionString } from './permissions.types'

/**
 * 将权限标准化为字符串格式
 */
export function normalizePermission(permission: Permission | PermissionString): PermissionString {
  if (typeof permission === 'string') {
    return permission as PermissionString
  }

  const { resource, action, scope } = permission
  return scope ? `${resource}:${action}:${scope}` : `${resource}:${action}`
}

/**
 * 解析权限字符串为各个组成部分
 * 支持格式：resource:action 或 resource:action:scope
 */
export function parsePermission(permission: PermissionString): Permission {
  const parts = permission.split(':')
  if (parts.length === 3) {
    return {
      resource: parts[0]!,
      action: parts[1]!,
      scope: parts[2] as PermissionScope,
    }
  }

  if (parts.length === 2) {
    return {
      resource: parts[0]!,
      action: parts[1]!,
      scope: undefined,
    }
  }

  throw new Error(`无效的权限格式: ${permission}`)
}

/**
 * 检查权限是否匹配模式
 */
export function matchPermission(permission: PermissionString, pattern: PermissionString): boolean {
  return permission === pattern
}

/**
 * 根据资源、操作和可选范围构建权限字符串
 */
export function buildPermission(resource: string, action: string, scope?: PermissionScope): PermissionString {
  return scope ? `${resource}:${action}:${scope}` : `${resource}:${action}`
}
