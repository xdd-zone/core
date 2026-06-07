import type { QueryClient } from '@tanstack/react-query'

import { ErrorBoundary } from '@console/components/ui'
import { RootLayout } from '@console/layout'
import { NotFound } from '@console/pages/error/NotFound'
import { Home } from '@console/pages/home/Home'
import { createRootRouteWithContext, createRoute, lazyRouteComponent, Outlet } from '@tanstack/react-router'
import { AlertTriangle, Crop, FileTextIcon, House, LayoutTemplate, Lock, Search, SquarePen } from 'lucide-react'

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

const homeRoute = createRoute({
  component: Home,
  getParentRoute: () => appLayoutRoute,
  path: '/',
  staticData: {
    contentWidth: 'full',
    icon: House,
    title: 'menu.home',
  },
})

const uiShowcaseRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/example/UiShowcase'), 'UiShowcase'),
  getParentRoute: () => appLayoutRoute,
  path: 'ui-showcase',
  staticData: {
    contentWidth: 'full',
    icon: LayoutTemplate,
    title: 'menu.uiShowcase',
  },
})

const markdownExampleRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/example/MarkdownExample'), 'MarkdownExample'),
  getParentRoute: () => appLayoutRoute,
  path: 'markdown-example',
  staticData: {
    icon: FileTextIcon,
    title: 'menu.markdownExample',
  },
})

const tiptapExampleRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/example/TiptapExample'), 'TiptapExample'),
  getParentRoute: () => appLayoutRoute,
  path: 'tiptap-example',
  staticData: {
    contentWidth: 'full',
    icon: SquarePen,
    title: 'menu.tiptapExample',
  },
})

const imageCropRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/example/ImageCropExample'), 'ImageCropExample'),
  getParentRoute: () => appLayoutRoute,
  path: 'image-crop',
  staticData: {
    contentWidth: 'full',
    icon: Crop,
    title: 'menu.imageCrop',
  },
})

const errorStateExampleRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/example/ErrorStateExample'), 'ErrorStateExample'),
  getParentRoute: () => appLayoutRoute,
  path: 'error-example',
  staticData: {
    icon: AlertTriangle,
    title: 'menu.errorExample',
  },
})

const forbiddenExampleRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/example/ForbiddenExample'), 'ForbiddenExample'),
  getParentRoute: () => appLayoutRoute,
  path: 'forbidden-example',
  staticData: {
    icon: Lock,
    title: 'menu.forbiddenExample',
  },
})

const notFoundExampleRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/example/NotFoundExample'), 'NotFoundExample'),
  getParentRoute: () => appLayoutRoute,
  path: 'not-found-example',
  staticData: {
    icon: Search,
    title: 'menu.notFoundExample',
  },
})

const notFoundRoute = createRoute({
  component: NotFound,
  getParentRoute: () => appLayoutRoute,
  path: '404',
  staticData: {
    tab: false,
    title: 'error.notFound.title',
  },
})

export const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([
    homeRoute,
    uiShowcaseRoute,
    markdownExampleRoute,
    tiptapExampleRoute,
    imageCropRoute,
    errorStateExampleRoute,
    forbiddenExampleRoute,
    notFoundExampleRoute,
    notFoundRoute,
  ]),
])
