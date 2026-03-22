import { Navigate, Outlet, useLocation } from 'react-router'

import { Loading } from '@/components/ui'
import { useAuthStore } from '@/modules/auth'

function FullscreenLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loading />
    </div>
  )
}

/**
 * 游客路由守卫。
 */
export function GuestOnly() {
  const { isAuthenticated, isBootstrapping } = useAuthStore()

  if (isBootstrapping) {
    return <FullscreenLoading />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

/**
 * 受保护路由守卫。
 */
export function RequireAuth() {
  const location = useLocation()
  const { isAuthenticated, isBootstrapping } = useAuthStore()

  if (isBootstrapping) {
    return <FullscreenLoading />
  }

  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}`

    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />
  }

  return <Outlet />
}

/**
 * 根路径重定向守卫。
 */
export function RootIndexRedirect() {
  const { isAuthenticated, isBootstrapping } = useAuthStore()

  if (isBootstrapping) {
    return <FullscreenLoading />
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}
