import type { QueryClient } from '@tanstack/react-query'

import { ensureConsolePathAccess } from '@console/app/access/access-control'
import { ErrorBoundary } from '@console/components/ui'
import { RootLayout } from '@console/layout'

import { Login } from '@console/pages/auth/Login'
import { Forbidden } from '@console/pages/error/Forbidden'
import { NotFound } from '@console/pages/error/NotFound'
import { createRootRouteWithContext, createRoute, lazyRouteComponent, Outlet } from '@tanstack/react-router'
import {
  AlertTriangle,
  BarChart3,
  Crop,
  FileText,
  Folder,
  KeyRound,
  LayoutTemplate,
  List,
  Lock,
  MessageCircle,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  SquarePen,
  Tag,
  UserCog,
  Users,
} from 'lucide-react'

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
    await ensureConsolePathAccess(context.queryClient, location.pathname)
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
  component: lazyRouteComponent(() => import('@console/pages/dashboard/Dashboard'), 'Dashboard'),
  getParentRoute: () => appLayoutRoute,
  path: 'dashboard',
  staticData: {
    icon: BarChart3,
    title: 'menu.dashboard',
  },
})

const articleListRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/article/list/ArticleList'), 'ArticleList'),
  getParentRoute: () => appLayoutRoute,
  path: 'articles',
  staticData: {
    icon: List,
    title: 'menu.articleList',
  },
})

const categoryListRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/article/category/CategoryList'), 'CategoryList'),
  getParentRoute: () => appLayoutRoute,
  path: 'categories',
  staticData: {
    icon: Folder,
    title: 'menu.categoryManagement',
  },
})

const tagListRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/article/tag/TagList'), 'TagList'),
  getParentRoute: () => appLayoutRoute,
  path: 'tags',
  staticData: {
    icon: Tag,
    title: 'menu.tagManagement',
  },
})

const commentListRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/article/comment/CommentList'), 'CommentList'),
  getParentRoute: () => appLayoutRoute,
  path: 'comments',
  staticData: {
    icon: MessageCircle,
    title: 'menu.commentManagement',
  },
})

const articleSettingsRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/article/settings/ArticleSettings'), 'ArticleSettings'),
  getParentRoute: () => appLayoutRoute,
  path: 'article-settings',
  staticData: {
    icon: Settings,
    title: 'menu.articleSettings',
  },
})

const imageCropRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/example/ImageCropExample'), 'ImageCropExample'),
  getParentRoute: () => appLayoutRoute,
  path: 'image-crop',
  staticData: {
    icon: Crop,
    title: 'menu.imageCrop',
  },
})

const uiShowcaseRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/example/UiShowcase'), 'UiShowcase'),
  getParentRoute: () => appLayoutRoute,
  path: 'ui-showcase',
  staticData: {
    icon: LayoutTemplate,
    title: 'menu.uiShowcase',
  },
})

const markdownExampleRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/example/MarkdownExample'), 'MarkdownExample'),
  getParentRoute: () => appLayoutRoute,
  path: 'markdown-example',
  staticData: {
    icon: FileText,
    title: 'menu.markdownExample',
  },
})

const tiptapExampleRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/example/TiptapExample'), 'TiptapExample'),
  getParentRoute: () => appLayoutRoute,
  path: 'tiptap-example',
  staticData: {
    icon: SquarePen,
    title: 'menu.tiptapExample',
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

const userListRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/user/list/UserList'), 'UserList'),
  getParentRoute: () => appLayoutRoute,
  path: 'users',
  staticData: {
    icon: Users,
    title: 'menu.userManagement',
  },
})

const userDetailRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/user/detail/UserDetail'), 'UserDetail'),
  getParentRoute: () => appLayoutRoute,
  path: 'users/$id',
  staticData: {
    title: 'menu.userDetail',
  },
})

const userEditRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/user/edit/UserEdit'), 'UserEdit'),
  getParentRoute: () => appLayoutRoute,
  path: 'users/$id/edit',
  staticData: {
    title: 'menu.userEdit',
  },
})

const roleListRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/role/list/RoleList'), 'RoleList'),
  getParentRoute: () => appLayoutRoute,
  path: 'roles',
  staticData: {
    icon: Shield,
    title: 'menu.roleManagement',
  },
})

const myProfileRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/user/profile/MyProfile'), 'MyProfile'),
  getParentRoute: () => appLayoutRoute,
  path: 'profile',
  staticData: {
    icon: UserCog,
    title: 'menu.myProfile',
  },
})

const myAccessRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/access/MyAccess'), 'MyAccess'),
  getParentRoute: () => appLayoutRoute,
  path: 'my-access',
  staticData: {
    icon: ShieldCheck,
    title: 'menu.myAccess',
  },
})

const userAccessRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/user/access/UserAccess'), 'UserAccess'),
  getParentRoute: () => appLayoutRoute,
  path: 'users/$id/access',
  staticData: {
    icon: KeyRound,
    title: 'access.manage.title',
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
    uiShowcaseRoute,
    markdownExampleRoute,
    tiptapExampleRoute,
    imageCropRoute,
    errorStateExampleRoute,
    forbiddenExampleRoute,
    notFoundExampleRoute,
    userListRoute,
    userDetailRoute,
    userEditRoute,
    userAccessRoute,
    roleListRoute,
    myProfileRoute,
    myAccessRoute,
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
