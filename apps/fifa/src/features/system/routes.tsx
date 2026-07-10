import type { FifaRouteRecord } from '@fifa/app/router/types'
import { lazyRouteComponent } from '@tanstack/react-router'
import { Activity } from 'lucide-react'

export const systemRoutes: FifaRouteRecord[] = [
  {
    component: lazyRouteComponent(() => import('./pages/SystemOperations'), 'SystemOperations'),
    icon: Activity,
    id: 'system.operations',
    layout: {
      contentWidth: 'full',
    },
    menu: {
      group: 'system',
      order: 5,
    },
    path: '/system/operations',
    title: 'menu.systemOperations',
  },
]
