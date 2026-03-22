import type { RouteObject } from 'react-router'

import { BarChart3, Crop, Folder, List, MessageCircle, Settings, Tag } from 'lucide-react'
import { Navigate } from 'react-router'

import { ErrorBoundary } from '@/components/ui'
import { HydrateFallback } from '@/components/ui/HydrateFallback'
import { RootLayout } from '@/layout'
import { Login } from '@/pages/auth/Login'
import { Forbidden } from '@/pages/error/Forbidden'
import { NotFound } from '@/pages/error/NotFound'

import { GuestOnly, RequireAuth, RootIndexRedirect } from './guards'

const protectedRoutes: RouteObject[] = [
  {
    handle: {
      icon: BarChart3,
      title: 'menu.dashboard',
    },
    lazy: async () => {
      const [{ Dashboard }] = await Promise.all([import('@/pages/dashboard/Dashboard')])

      return { Component: Dashboard }
    },
    path: 'dashboard',
  },
  {
    handle: {
      icon: List,
      title: 'menu.articleList',
    },
    lazy: async () => {
      const { ArticleList } = await import('@/pages/article/list/ArticleList')

      return { Component: ArticleList }
    },
    path: 'articles',
  },
  {
    handle: {
      icon: Folder,
      title: 'menu.categoryManagement',
    },
    lazy: async () => {
      const { CategoryList } = await import('@/pages/article/category/CategoryList')

      return { Component: CategoryList }
    },
    path: 'categories',
  },
  {
    handle: {
      icon: Tag,
      title: 'menu.tagManagement',
    },
    lazy: async () => {
      const { TagList } = await import('@/pages/article/tag/TagList')

      return { Component: TagList }
    },
    path: 'tags',
  },
  {
    handle: {
      icon: MessageCircle,
      title: 'menu.commentManagement',
    },
    lazy: async () => {
      const { CommentList } = await import('@/pages/article/comment/CommentList')

      return { Component: CommentList }
    },
    path: 'comments',
  },
  {
    handle: {
      icon: Settings,
      title: 'menu.articleSettings',
    },
    lazy: async () => {
      const { ArticleSettings } = await import('@/pages/article/settings/ArticleSettings')

      return { Component: ArticleSettings }
    },
    path: 'article-settings',
  },
  {
    handle: {
      icon: Crop,
      title: 'menu.imageCrop',
    },
    lazy: async () => {
      const { ImageCropExample } = await import('@/pages/example/ImageCropExample')

      return { Component: ImageCropExample }
    },
    path: 'image-crop',
  },
]

/**
 * 应用路由。
 */
export const appRoutes: RouteObject[] = [
  {
    children: [
      {
        element: <RootIndexRedirect />,
        index: true,
      },
      {
        children: [
          {
            Component: Login,
            handle: {
              tab: false,
              title: 'auth.loginTitle',
            },
            path: 'login',
          },
        ],
        element: <GuestOnly />,
      },
      {
        children: [
          {
            HydrateFallback,
            children: [
              {
                element: <Navigate to="/dashboard" replace />,
                index: true,
              },
              ...protectedRoutes,
            ],
            element: <RootLayout />,
          },
        ],
        element: <RequireAuth />,
      },
      {
        Component: Forbidden,
        handle: {
          tab: false,
          title: '403 禁止访问',
        },
        path: '403',
      },
      {
        Component: NotFound,
        handle: {
          tab: false,
          title: '404 页面不存在',
        },
        path: '404',
      },
      {
        element: <Navigate to="/404" replace />,
        path: '*',
      },
    ],
    errorElement: <ErrorBoundary />,
    path: '/',
  },
]
