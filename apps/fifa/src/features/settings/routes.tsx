import type { FifaRouteRecord } from '@fifa/app/router/types'
import { lazyRouteComponent } from '@tanstack/react-router'
import { Bot } from 'lucide-react'

export const settingsRoutes: FifaRouteRecord[] = [
  {
    component: lazyRouteComponent(() => import('./pages/LlmSettings'), 'LlmSettings'),
    icon: Bot,
    id: 'settings.llm',
    layout: {
      contentWidth: 'full',
    },
    menu: {
      group: 'settings',
      order: 10,
    },
    path: '/settings/llm',
    title: 'menu.llmSettings',
  },
]
