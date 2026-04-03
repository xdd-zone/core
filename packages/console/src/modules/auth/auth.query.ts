import type { QueryClient } from '@tanstack/react-query'
import type { SessionPayload, SignInEmailBody } from './auth.types'

import { CURRENT_USER_ACCESS_QUERY_KEY } from '@console/modules/rbac'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { authApi } from './auth.api'
import { applySessionPayload, clearAuthState, EMPTY_SESSION_PAYLOAD } from './auth.store'

const AUTH_METHODS_QUERY_KEY = ['auth', 'methods'] as const
const AUTH_SESSION_QUERY_KEY = ['auth', 'session'] as const

/**
 * 登录方式查询配置。
 */
export function getAuthMethodsQueryOptions() {
  return queryOptions({
    queryFn: authApi.getMethods,
    queryKey: AUTH_METHODS_QUERY_KEY,
    staleTime: 60_000,
  })
}

/**
 * 登录方式查询。
 */
export function useAuthMethodsQuery() {
  return useQuery(getAuthMethodsQueryOptions())
}

/**
 * 当前会话查询配置。
 */
export function getAuthSessionQueryOptions() {
  return queryOptions({
    queryFn: authApi.getSession,
    queryKey: AUTH_SESSION_QUERY_KEY,
    staleTime: 60_000,
  })
}

/**
 * 确保当前会话已完成初始化，并同步到 auth store。
 */
export async function ensureAuthSession(queryClient: QueryClient): Promise<SessionPayload> {
  try {
    const payload = await queryClient.ensureQueryData(getAuthSessionQueryOptions())
    applySessionPayload(payload)
    return payload
  } catch {
    queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, EMPTY_SESSION_PAYLOAD)
    queryClient.removeQueries({ queryKey: CURRENT_USER_ACCESS_QUERY_KEY })
    clearAuthState()
    return EMPTY_SESSION_PAYLOAD
  }
}

/**
 * 登录 mutation。
 */
export function useLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SignInEmailBody) => {
      await authApi.signIn(payload)
      return await authApi.getSession()
    },
    onSuccess: (session) => {
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, session)
      queryClient.removeQueries({ queryKey: CURRENT_USER_ACCESS_QUERY_KEY })
      applySessionPayload(session)
    },
  })
}

/**
 * 登出 mutation。
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await authApi.signOut()
    },
    onSettled: () => {
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, EMPTY_SESSION_PAYLOAD)
      queryClient.removeQueries({ queryKey: CURRENT_USER_ACCESS_QUERY_KEY })
      clearAuthState()
    },
  })
}
