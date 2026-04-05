import { Loading } from '@console/components'

import { Outlet, useRouterState } from '@tanstack/react-router'

/**
 * 应用内容区域组件
 * 渲染路由页面内容
 */
export function AppContent() {
  const isNavigating = useRouterState({
    select: (state) => state.status === 'pending',
  })
  return (
    <main className="guide-content h-full flex-1 overflow-auto">
      <div className="guide-content-inner text-fg h-full min-h-full">{isNavigating ? <Loading /> : <Outlet />}</div>
    </main>
  )
}
