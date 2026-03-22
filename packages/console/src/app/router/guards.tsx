import type { QueryClient } from '@tanstack/react-query'

import { redirect } from '@tanstack/react-router'

import { ensureAuthSession } from '@/modules/auth'

export interface LoginRouteSearch {
  redirect?: string
}

/**
 * 登录页路径。
 */
export const LOGIN_ROUTE_PATH = '/login'

/**
 * 后台首页路径。
 */
export const DASHBOARD_ROUTE_PATH = '/dashboard'

/**
 * 解析登录页 search。
 */
export function validateLoginSearch(search: Record<string, unknown>): LoginRouteSearch {
  return {
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }
}

/**
 * 过滤重定向地址，避免跳出当前站点。
 */
export function sanitizeRedirectPath(redirectPath?: string): string | undefined {
  if (!redirectPath) {
    return undefined
  }

  try {
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    const url = new URL(redirectPath, baseOrigin)

    if (url.origin !== baseOrigin) {
      return undefined
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return undefined
  }
}

/**
 * 仅允许游客访问。
 */
export async function requireGuest(queryClient: QueryClient) {
  const session = await ensureAuthSession(queryClient)

  if (session.isAuthenticated) {
    throw redirect({
      replace: true,
      to: DASHBOARD_ROUTE_PATH,
    })
  }
}

/**
 * 仅允许已登录用户访问。
 */
export async function requireAuth(queryClient: QueryClient, locationHref: string) {
  const session = await ensureAuthSession(queryClient)

  if (!session.isAuthenticated) {
    throw redirect({
      replace: true,
      search: {
        redirect: sanitizeRedirectPath(locationHref),
      },
      to: LOGIN_ROUTE_PATH,
    })
  }
}

/**
 * 根路径按登录态自动跳转。
 */
export async function redirectFromRoot(queryClient: QueryClient) {
  const session = await ensureAuthSession(queryClient)

  throw redirect({
    replace: true,
    to: session.isAuthenticated ? DASHBOARD_ROUTE_PATH : LOGIN_ROUTE_PATH,
  })
}
