import type { QueryClient } from '@tanstack/react-query'

import { createRootRouteWithContext, createRoute, lazyRouteComponent, Outlet } from '@tanstack/react-router'
import { BarChart3, Crop, Folder, List, MessageCircle, Settings, Tag } from 'lucide-react'

import { ErrorBoundary } from '@/components/ui'
import { RootLayout } from '@/layout'
import { Login } from '@/pages/auth/Login'
import { Forbidden } from '@/pages/error/Forbidden'
import { NotFound } from '@/pages/error/NotFound'

import { redirectFromRoot, requireAuth, requireGuest, validateLoginSearch } from './guards'

export interface RouterContext {
  queryClient: QueryClient
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  errorComponent: ErrorBoundary,
  notFoundComponent: NotFound,
})

const rootIndexRoute = createRoute({
  beforeLoad: async ({ context }) => {
    await redirectFromRoot(context.queryClient)
  },
  getParentRoute: () => rootRoute,
  path: '/',
})

const loginRoute = createRoute({
  beforeLoad: async ({ context }) => {
    await requireGuest(context.queryClient)
  },
  component: Login,
  getParentRoute: () => rootRoute,
  path: 'login',
  staticData: {
    tab: false,
    title: 'auth.loginTitle',
  },
  validateSearch: validateLoginSearch,
})

const forbiddenRoute = createRoute({
  component: Forbidden,
  getParentRoute: () => rootRoute,
  path: '403',
  staticData: {
    tab: false,
    title: '403 禁止访问',
  },
})

const notFoundRoute = createRoute({
  component: NotFound,
  getParentRoute: () => rootRoute,
  path: '404',
  staticData: {
    tab: false,
    title: '404 页面不存在',
  },
})

const protectedRoute = createRoute({
  beforeLoad: async ({ context, location }) => {
    await requireAuth(context.queryClient, location.href)
  },
  getParentRoute: () => rootRoute,
  id: 'protected',
})

const appLayoutRoute = createRoute({
  component: RootLayout,
  getParentRoute: () => protectedRoute,
  id: 'app-layout',
})

const dashboardRoute = createRoute({
  component: lazyRouteComponent(() => import('@/pages/dashboard/Dashboard'), 'Dashboard'),
  getParentRoute: () => appLayoutRoute,
  path: 'dashboard',
  staticData: {
    icon: BarChart3,
    title: 'menu.dashboard',
  },
})

const articleListRoute = createRoute({
  component: lazyRouteComponent(() => import('@/pages/article/list/ArticleList'), 'ArticleList'),
  getParentRoute: () => appLayoutRoute,
  path: 'articles',
  staticData: {
    icon: List,
    title: 'menu.articleList',
  },
})

const categoryListRoute = createRoute({
  component: lazyRouteComponent(() => import('@/pages/article/category/CategoryList'), 'CategoryList'),
  getParentRoute: () => appLayoutRoute,
  path: 'categories',
  staticData: {
    icon: Folder,
    title: 'menu.categoryManagement',
  },
})

const tagListRoute = createRoute({
  component: lazyRouteComponent(() => import('@/pages/article/tag/TagList'), 'TagList'),
  getParentRoute: () => appLayoutRoute,
  path: 'tags',
  staticData: {
    icon: Tag,
    title: 'menu.tagManagement',
  },
})

const commentListRoute = createRoute({
  component: lazyRouteComponent(() => import('@/pages/article/comment/CommentList'), 'CommentList'),
  getParentRoute: () => appLayoutRoute,
  path: 'comments',
  staticData: {
    icon: MessageCircle,
    title: 'menu.commentManagement',
  },
})

const articleSettingsRoute = createRoute({
  component: lazyRouteComponent(() => import('@/pages/article/settings/ArticleSettings'), 'ArticleSettings'),
  getParentRoute: () => appLayoutRoute,
  path: 'article-settings',
  staticData: {
    icon: Settings,
    title: 'menu.articleSettings',
  },
})

const imageCropRoute = createRoute({
  component: lazyRouteComponent(() => import('@/pages/example/ImageCropExample'), 'ImageCropExample'),
  getParentRoute: () => appLayoutRoute,
  path: 'image-crop',
  staticData: {
    icon: Crop,
    title: 'menu.imageCrop',
  },
})

const protectedRouteTree = protectedRoute.addChildren([
  appLayoutRoute.addChildren([
    dashboardRoute,
    articleListRoute,
    categoryListRoute,
    tagListRoute,
    commentListRoute,
    articleSettingsRoute,
    imageCropRoute,
  ]),
])

/**
 * TanStack Router 路由树。
 */
export const routeTree = rootRoute.addChildren([
  rootIndexRoute,
  loginRoute,
  forbiddenRoute,
  notFoundRoute,
  protectedRouteTree,
])
