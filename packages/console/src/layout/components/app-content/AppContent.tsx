import { Outlet, useRouterState } from '@tanstack/react-router'

import { Loading } from '@/components'

/**
 * 应用内容区域组件
 * 渲染路由页面内容
 */
export function AppContent() {
  const isNavigating = useRouterState({
    select: (state) => state.status === 'pending',
  })
  return (
    <main className="h-full flex-1 overflow-auto p-2">
      <div className="text-fg h-full min-h-full rounded-lg shadow-sm">{isNavigating ? <Loading /> : <Outlet />}</div>
    </main>
  )
}
