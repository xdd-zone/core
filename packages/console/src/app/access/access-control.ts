import type { PermissionSummary } from '@console/modules/rbac'
import type { QueryClient } from '@tanstack/react-query'
import type { PermissionString, SystemPermissionKey } from '@xdd-zone/nexus/permissions'
import { currentUserPermissionsQueryOptions } from '@console/modules/rbac'
import { redirect } from '@tanstack/react-router'
import { matchPermission, Permissions } from '@xdd-zone/nexus/permissions'

interface ConsoleAccessRequirement {
  all?: readonly SystemPermissionKey[]
  any?: readonly SystemPermissionKey[]
}

interface ConsoleRouteAccessRule {
  matcher: RegExp
  pathPattern: string
  requirement: ConsoleAccessRequirement
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function createPathMatcher(pathPattern: string) {
  const segments = pathPattern.split('/').filter(Boolean)

  if (segments.length === 0) {
    return /^\/$/
  }

  return new RegExp(
    `^/${segments.map((segment) => (segment.startsWith('$') ? '[^/]+' : escapeRegex(segment))).join('/')}$`,
  )
}

function normalizePathname(pathname: string) {
  if (pathname === '/') {
    return pathname
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

function hasPermission(permissionKeys: ReadonlySet<string>, permission: SystemPermissionKey) {
  if (permissionKeys.has(Permissions.SYSTEM.MANAGE)) {
    return true
  }

  for (const availablePermission of permissionKeys) {
    if (matchPermission(permission, availablePermission as PermissionString)) {
      return true
    }
  }

  return false
}

export const consoleRouteAccessRules: readonly ConsoleRouteAccessRule[] = [
  {
    matcher: createPathMatcher('/articles/new'),
    pathPattern: '/articles/new',
    requirement: {
      all: [Permissions.POST.WRITE_ALL],
    },
  },
  {
    matcher: createPathMatcher('/articles/$id/edit'),
    pathPattern: '/articles/$id/edit',
    requirement: {
      all: [Permissions.POST.WRITE_ALL],
    },
  },
  {
    matcher: createPathMatcher('/articles/$id'),
    pathPattern: '/articles/$id',
    requirement: {
      all: [Permissions.POST.READ_ALL],
    },
  },
  {
    matcher: createPathMatcher('/articles'),
    pathPattern: '/articles',
    requirement: {
      all: [Permissions.POST.READ_ALL],
    },
  },
  {
    matcher: createPathMatcher('/categories'),
    pathPattern: '/categories',
    requirement: {
      all: [Permissions.POST.READ_ALL],
    },
  },
  {
    matcher: createPathMatcher('/tags'),
    pathPattern: '/tags',
    requirement: {
      all: [Permissions.POST.READ_ALL],
    },
  },
  {
    matcher: createPathMatcher('/comments'),
    pathPattern: '/comments',
    requirement: {
      all: [Permissions.COMMENT.READ_ALL],
    },
  },
  {
    matcher: createPathMatcher('/article-settings'),
    pathPattern: '/article-settings',
    requirement: {
      any: [
        Permissions.MEDIA.READ_ALL,
        Permissions.MEDIA.WRITE_ALL,
        Permissions.SITE_CONFIG.READ,
        Permissions.SITE_CONFIG.WRITE,
      ],
    },
  },
  {
    matcher: createPathMatcher('/users/$id/access'),
    pathPattern: '/users/$id/access',
    requirement: {
      all: [
        Permissions.USER.READ_ALL,
        Permissions.ROLE.READ_ALL,
        Permissions.USER_PERMISSION.READ_ALL,
        Permissions.USER_ROLE.ASSIGN_ALL,
        Permissions.USER_ROLE.REVOKE_ALL,
      ],
    },
  },
  {
    matcher: createPathMatcher('/users/$id/edit'),
    pathPattern: '/users/$id/edit',
    requirement: {
      all: [Permissions.USER.READ_ALL, Permissions.USER.UPDATE_ALL],
    },
  },
  {
    matcher: createPathMatcher('/users/$id'),
    pathPattern: '/users/$id',
    requirement: {
      all: [Permissions.USER.READ_ALL, Permissions.ROLE.READ_ALL],
    },
  },
  {
    matcher: createPathMatcher('/users'),
    pathPattern: '/users',
    requirement: {
      all: [Permissions.USER.READ_ALL],
    },
  },
  {
    matcher: createPathMatcher('/roles'),
    pathPattern: '/roles',
    requirement: {
      all: [Permissions.ROLE.READ_ALL],
    },
  },
  {
    matcher: createPathMatcher('/my-access'),
    pathPattern: '/my-access',
    requirement: {
      all: [Permissions.USER_PERMISSION.READ_OWN],
    },
  },
  {
    matcher: createPathMatcher('/profile'),
    pathPattern: '/profile',
    requirement: {
      all: [Permissions.USER.READ_OWN, Permissions.USER.UPDATE_OWN],
    },
  },
] as const

export function createPermissionKeySet(permissions?: readonly Pick<PermissionSummary, 'key'>[]) {
  return new Set((permissions ?? []).map((permission) => permission.key as PermissionString))
}

export function getConsoleRouteAccessRule(pathname: string) {
  const normalizedPathname = normalizePathname(pathname)

  return consoleRouteAccessRules.find((rule) => rule.matcher.test(normalizedPathname))
}

export function hasConsoleAccess(permissionKeys: Iterable<string>, requirement?: ConsoleAccessRequirement) {
  if (!requirement) {
    return true
  }

  const permissionKeySet = permissionKeys instanceof Set ? permissionKeys : new Set(permissionKeys)

  if (permissionKeySet.has(Permissions.SYSTEM.MANAGE)) {
    return true
  }

  if (requirement.all && !requirement.all.every((permission) => hasPermission(permissionKeySet, permission))) {
    return false
  }

  if (requirement.any && !requirement.any.some((permission) => hasPermission(permissionKeySet, permission))) {
    return false
  }

  return true
}

export function canAccessConsolePath(pathname: string, permissionKeys: Iterable<string>) {
  const accessRule = getConsoleRouteAccessRule(pathname)

  if (!accessRule) {
    return true
  }

  return hasConsoleAccess(permissionKeys, accessRule.requirement)
}

export async function ensureConsolePathAccess(queryClient: QueryClient, pathname: string) {
  const accessRule = getConsoleRouteAccessRule(pathname)

  if (!accessRule) {
    return
  }

  const currentUserPermissions = await queryClient.ensureQueryData(currentUserPermissionsQueryOptions())
  const permissionKeys = createPermissionKeySet(currentUserPermissions.permissions)

  if (!hasConsoleAccess(permissionKeys, accessRule.requirement)) {
    throw redirect({
      replace: true,
      to: '/403',
    })
  }
}
