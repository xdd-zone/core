import type { ConsoleRouteRecord } from '@console/app/router/types'

import { NotFound } from './pages/NotFound'

export const errorRoutes: ConsoleRouteRecord[] = [
  {
    component: NotFound,
    id: 'errors.notFound',
    menu: false,
    path: '/404',
    tab: false,
    title: 'error.notFound.title',
  },
]
