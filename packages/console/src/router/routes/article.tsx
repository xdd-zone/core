import type { RouteObject } from 'react-router'

import { FileText, Folder, List, MessageCircle, Settings, Tag } from 'lucide-react'
import { Navigate } from 'react-router'

import { RouteType } from '../types'

/**
 * 文章管理路由
 */
export const articleRoutes: RouteObject[] = [
  {
    children: [
      {
        element: <Navigate to="/article/list" replace />,
        index: true,
      },
      {
        handle: {
          icon: List,
          title: 'menu.articleList',
          type: RouteType.MENU,
        },
        lazy: async () => {
          const { ArticleList } = await import('@/pages/article/list/ArticleList')

          return { Component: ArticleList }
        },
        path: 'list',
      },
      {
        handle: {
          icon: Settings,
          title: 'menu.articleSettings',
          type: RouteType.MENU,
        },
        lazy: async () => {
          const { ArticleSettings } = await import('@/pages/article/settings/ArticleSettings')

          return { Component: ArticleSettings }
        },
        path: 'settings',
      },
      {
        handle: {
          icon: Folder,
          title: 'menu.categoryManagement',
          type: RouteType.MENU,
        },
        lazy: async () => {
          const { CategoryList } = await import('@/pages/article/category/CategoryList')

          return { Component: CategoryList }
        },
        path: 'category',
      },
      {
        handle: {
          icon: Tag,
          title: 'menu.tagManagement',
          type: RouteType.MENU,
        },
        lazy: async () => {
          const { TagList } = await import('@/pages/article/tag/TagList')

          return { Component: TagList }
        },
        path: 'tag',
      },
      {
        handle: {
          icon: MessageCircle,
          title: 'menu.commentManagement',
          type: RouteType.MENU,
        },
        lazy: async () => {
          const { CommentList } = await import('@/pages/article/comment/CommentList')

          return { Component: CommentList }
        },
        path: 'comment',
      },
    ],
    handle: {
      icon: FileText,
      title: 'menu.articleManagement',
      type: RouteType.MENU,
    },
    path: '/article',
  },
]
