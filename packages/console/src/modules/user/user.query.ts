import type { UpdateMyProfileBody, UpdateUserBody, UpdateUserStatusBody, UserListQuery } from './user.types'

import { api, unwrapEdenResponse } from '@console/shared/api'
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

const userApiRoot = api.user

const USER_LIST_QUERY_KEY = ['users'] as const
const USER_DETAIL_QUERY_KEY = (id: string) => ['users', id] as const
const MY_PROFILE_QUERY_KEY = ['users', 'me'] as const

/**
 * 用户列表查询配置。
 */
export function userListQueryOptions(query: UserListQuery = {}) {
  return queryOptions({
    queryFn: async () =>
      unwrapEdenResponse(
        await userApiRoot.get({
          query: {
            page: query.page,
            pageSize: query.pageSize,
            status: query.status,
            keyword: query.keyword,
          },
        }),
      ),
    queryKey: [...USER_LIST_QUERY_KEY, query],
    staleTime: 30_000,
  })
}

/**
 * 用户详情查询配置。
 */
export function userDetailQueryOptions(id: string) {
  return queryOptions({
    queryFn: async () => unwrapEdenResponse(await userApiRoot({ id }).get()),
    queryKey: USER_DETAIL_QUERY_KEY(id),
    staleTime: 30_000,
  })
}

/**
 * 当前用户资料查询配置。
 */
export function myProfileQueryOptions() {
  return queryOptions({
    queryFn: async () => unwrapEdenResponse(await userApiRoot.me.get()),
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
    mutationFn: async (body: UpdateMyProfileBody) => unwrapEdenResponse(await userApiRoot.me.patch(body)),
  })
}

/**
 * 后台更新用户资料 mutation。
 */
export function useUpdateUserMutation() {
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateUserBody & { id: string }) =>
      unwrapEdenResponse(await userApiRoot({ id }).patch(body)),
  })
}

/**
 * 后台更新用户状态 mutation。
 */
export function useUpdateUserStatusMutation() {
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UpdateUserStatusBody['status'] }) =>
      unwrapEdenResponse(await userApiRoot({ id }).status.patch({ status })),
  })
}
