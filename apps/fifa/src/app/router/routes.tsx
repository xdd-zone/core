import type { QueryClient } from '@tanstack/react-query'

import { fifaRouteRecords } from '@fifa/app/router/records'
import { ErrorBoundary } from '@fifa/components/ui'
import { NotFound } from '@fifa/features/errors/pages/NotFound'
import { RootLayout } from '@fifa/layout'
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

const appRoutes = fifaRouteRecords.map((record) =>
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
