import type { RouteObject } from 'react-router'

import { AlertTriangle } from 'lucide-react'
import { Navigate } from 'react-router'

import { Forbidden } from '@/pages/error/Forbidden'
import { NotFound } from '@/pages/error/NotFound'

import { RouteType } from '../types'

export const errorRoutes: RouteObject[] = [
  {
    Component: Forbidden,
    handle: {
      icon: AlertTriangle,
      title: '403 禁止访问',
      type: RouteType.GLOBAL,
    },
    path: '/403',
  },
  {
    Component: NotFound,
    handle: {
      icon: AlertTriangle,
      title: '404 页面不存在',
      type: RouteType.GLOBAL,
    },
    path: '/404',
  },
  {
    element: <Navigate to="/404" replace />,
    path: '*', // 通配符路由，重定向所有不存在的页面到/404
  },
]
