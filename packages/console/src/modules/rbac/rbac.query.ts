import type { AssignRoleToUserBody, RoleListQuery } from './rbac.types'

import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

import { rbacApi } from './rbac.api'

const ROLE_LIST_QUERY_KEY = ['roles'] as const
const USER_ROLES_QUERY_KEY = (userId: string) => ['users', userId, 'roles'] as const
const USER_PERMISSIONS_QUERY_KEY = (userId: string) => ['users', userId, 'permissions'] as const
export const CURRENT_USER_ACCESS_QUERY_KEY = ['current-user'] as const
const CURRENT_USER_PERMISSIONS_KEY = [...CURRENT_USER_ACCESS_QUERY_KEY, 'permissions'] as const
const CURRENT_USER_ROLES_KEY = [...CURRENT_USER_ACCESS_QUERY_KEY, 'roles'] as const

/**
 * 角色列表查询配置。
 */
export function roleListQueryOptions(query: RoleListQuery = {}) {
  return queryOptions({
    queryFn: () => rbacApi.listRoles(query),
    queryKey: [...ROLE_LIST_QUERY_KEY, query],
    staleTime: 30_000,
  })
}

/**
 * 用户角色列表查询配置。
 */
export function userRolesQueryOptions(userId: string) {
  return queryOptions({
    queryFn: () => rbacApi.getUserRoles(userId),
    queryKey: USER_ROLES_QUERY_KEY(userId),
    staleTime: 30_000,
  })
}

/**
 * 用户权限查询配置。
 */
export function userPermissionsQueryOptions(userId: string) {
  return queryOptions({
    queryFn: () => rbacApi.getUserPermissions(userId),
    queryKey: USER_PERMISSIONS_QUERY_KEY(userId),
    staleTime: 30_000,
  })
}

/**
 * 当前用户权限查询配置。
 */
export function currentUserPermissionsQueryOptions() {
  return queryOptions({
    queryFn: () => rbacApi.getCurrentUserPermissions(),
    queryKey: CURRENT_USER_PERMISSIONS_KEY,
    staleTime: 30_000,
  })
}

/**
 * 当前用户角色查询配置。
 */
export function currentUserRolesQueryOptions() {
  return queryOptions({
    queryFn: () => rbacApi.getCurrentUserRoles(),
    queryKey: CURRENT_USER_ROLES_KEY,
    staleTime: 30_000,
  })
}

/**
 * 角色列表查询 Hook。
 */
export function useRoleListQuery(query: RoleListQuery = {}) {
  return useQuery(roleListQueryOptions(query))
}

/**
 * 用户角色列表查询 Hook。
 */
export function useUserRolesQuery(userId: string) {
  return useQuery(userRolesQueryOptions(userId))
}

/**
 * 用户权限查询 Hook。
 */
export function useUserPermissionsQuery(userId: string) {
  return useQuery(userPermissionsQueryOptions(userId))
}

/**
 * 当前用户权限查询 Hook。
 */
export function useCurrentUserPermissionsQuery() {
  return useQuery(currentUserPermissionsQueryOptions())
}

/**
 * 当前用户角色查询 Hook。
 */
export function useCurrentUserRolesQuery() {
  return useQuery(currentUserRolesQueryOptions())
}

/**
 * 为用户分配角色 mutation。
 */
export function useAssignRoleMutation() {
  return useMutation({
    mutationFn: ({ userId, ...body }: AssignRoleToUserBody & { userId: string }) =>
      rbacApi.assignRoleToUser(userId, body),
  })
}

/**
 * 移除用户角色 mutation。
 */
export function useRemoveRoleMutation() {
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => rbacApi.removeRoleFromUser(userId, roleId),
  })
}
