import type { QueryClient } from '@tanstack/react-query'

import { consoleRouteRecords } from '@console/app/router/records'
import { ErrorBoundary } from '@console/components/ui'
import { NotFound } from '@console/features/errors/pages/NotFound'
import { RootLayout } from '@console/layout'
import { createRootRouteWithContext, createRoute, Outlet } from '@tanstack/react-router'

export interface RouterContext {
  queryClient: QueryClient
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  errorComponent: ErrorBoundary,
  notFoundComponent: NotFound,
})

const appLayoutRoute = createRoute({
  component: RootLayout,
  getParentRoute: () => rootRoute,
  id: 'app-layout',
})

function toRoutePath(path: string) {
  return path === '/' ? path : path.replace(/^\//, '')
}

const appRoutes = consoleRouteRecords.map((record) =>
  createRoute({
    component: record.component,
    getParentRoute: () => appLayoutRoute,
    path: toRoutePath(record.path),
    staticData: {
      icon: record.icon,
      id: record.id,
      layout: record.layout,
      tab: record.tab,
      title: record.title,
    },
  }),
)

export const routeTree = rootRoute.addChildren([appLayoutRoute.addChildren(appRoutes)])
