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
 * 支持格式：
 * - resource:action (2 parts)
 * - resource:action:scope (3 parts)
 * - resource:subresource:action:scope (4 parts)
 */
export function parsePermission(permission: PermissionString): Permission {
  if (permission === '*') {
    return { resource: '*', action: '*', scope: undefined }
  }

  const parts = permission.split(':')
  if (parts.length === 4) {
    // resource:subresource:action:scope 格式
    // 例如：user:role:read:own -> resource="user:role", action="read", scope="own"
    return {
      resource: `${parts[0]}:${parts[1]}`,
      action: parts[2]!,
      scope: parts[3] as PermissionScope,
    }
  }

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
 * 支持通配符: *, article:*, article:create:*
 */
export function matchPermission(permission: PermissionString, pattern: PermissionString): boolean {
  // 超级管理员
  if (pattern === '*') {
    return true
  }

  const permParts = permission.split(':')
  const patternParts = pattern.split(':')

  // 逐部分匹配，支持通配符
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]
    const permPart = permParts[i]

    if (patternPart === '*') {
      continue
    }

    if (patternPart !== permPart) {
      return false
    }
  }

  return true
}

/**
 * 根据资源、操作和可选范围构建权限字符串
 */
export function buildPermission(resource: string, action: string, scope?: PermissionScope): PermissionString {
  return scope ? `${resource}:${action}:${scope}` : `${resource}:${action}`
}
