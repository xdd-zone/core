import { resolveRouteMeta } from '@console/app/router/types'
import { Loading } from '@console/components'

import { Outlet, useMatches, useRouterState } from '@tanstack/react-router'
import { clsx } from 'clsx'

/**
 * 应用内容区域组件
 * 渲染路由页面内容
 */
export function AppContent() {
  const matches = useMatches()
  const isNavigating = useRouterState({
    select: (state) => state.status === 'pending',
  })
  const currentRouteMeta = resolveRouteMeta(matches[matches.length - 1]?.staticData)
  const isFullWidthContent = currentRouteMeta.contentWidth === 'full'

  return (
    <main className="guide-content h-full flex-1 overflow-auto">
      <div
        className={clsx(
          'guide-content-inner text-fg h-full min-h-full',
          isFullWidthContent && 'guide-content-inner--full',
        )}
      >
        {isNavigating ? <Loading /> : <Outlet />}
      </div>
    </main>
  )
}
