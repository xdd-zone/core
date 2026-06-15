import { HydrateFallback } from '@fifa/components/ui/HydrateFallback'

import { createRouter } from '@tanstack/react-router'

import { queryClient } from '../query-client'
import { routeTree } from './routes'

function getRouterBasepath(): string {
  const devBasePath = import.meta.env.VITE_DEV_BASE_PATH?.replace(/\/$/, '') || ''

  if (devBasePath === '') return '/'
  if (typeof window === 'undefined') return devBasePath

  return window.location.pathname === devBasePath || window.location.pathname.startsWith(`${devBasePath}/`)
    ? devBasePath
    : '/'
}

export const router = createRouter({
  basepath: getRouterBasepath(),
  context: {
    queryClient,
  },
  defaultPendingComponent: HydrateFallback,
  defaultPreload: 'intent',
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
