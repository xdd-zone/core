import type { UpdateMyProfileBody, UpdateUserBody, UpdateUserStatusBody, UserListQuery } from './user.types'

import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

import { userApi } from './user.api'

const USER_LIST_QUERY_KEY = ['users'] as const
const USER_DETAIL_QUERY_KEY = (id: string) => ['users', id] as const
const MY_PROFILE_QUERY_KEY = ['users', 'me'] as const

/**
 * 用户列表查询配置。
 */
export function userListQueryOptions(query: UserListQuery = {}) {
  return queryOptions({
    queryFn: () => userApi.list(query),
    queryKey: [...USER_LIST_QUERY_KEY, query],
    staleTime: 30_000,
  })
}

/**
 * 用户详情查询配置。
 */
export function userDetailQueryOptions(id: string) {
  return queryOptions({
    queryFn: () => userApi.findById(id),
    queryKey: USER_DETAIL_QUERY_KEY(id),
    staleTime: 30_000,
  })
}

/**
 * 当前用户资料查询配置。
 */
export function myProfileQueryOptions() {
  return queryOptions({
    queryFn: () => userApi.getMe(),
    queryKey: MY_PROFILE_QUERY_KEY,
    staleTime: 30_000,
  })
}

/**
 * 用户列表查询 Hook。
 */
export function useUserListQuery(query: UserListQuery = {}) {
  return useQuery(userListQueryOptions(query))
}

/**
 * 用户详情查询 Hook。
 */
export function useUserDetailQuery(id: string) {
  return useQuery(userDetailQueryOptions(id))
}

/**
 * 当前用户资料查询 Hook。
 */
export function useMyProfileQuery() {
  return useQuery(myProfileQueryOptions())
}

/**
 * 更新当前用户资料 mutation。
 */
export function useUpdateMeMutation() {
  return useMutation({
    mutationFn: (body: UpdateMyProfileBody) => userApi.updateMe(body),
  })
}

/**
 * 后台更新用户资料 mutation。
 */
export function useUpdateUserMutation() {
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateUserBody & { id: string }) => userApi.updateByAdmin(id, body),
  })
}

/**
 * 后台更新用户状态 mutation。
 */
export function useUpdateUserStatusMutation() {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UpdateUserStatusBody['status'] }) =>
      userApi.updateStatus(id, { status }),
  })
}
