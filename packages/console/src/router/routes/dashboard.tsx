import type { RouteObject } from 'react-router'

import { BarChart3 } from 'lucide-react'

import { RouteType } from '../types'

/**
 * 仪表盘路由
 */
export const dashboardRoutes: RouteObject[] = [
  {
    handle: {
      auth: 'dashboard',
      icon: BarChart3,
      order: 1,
      title: 'menu.dashboard',
      type: RouteType.MENU,
    },

    lazy: async () => {
      const [{ Dashboard }] = await Promise.all([import('@/pages/dashboard/Dashboard')])

      return { Component: Dashboard }
    },
    path: '/dashboard',
  },
]
