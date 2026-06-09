import type { FifaRouteRecord } from '@fifa/app/router/types'

import { NotFound } from './pages/NotFound'

export const errorRoutes: FifaRouteRecord[] = [
  {
    component: NotFound,
    id: 'errors.notFound',
    menu: false,
    path: '/404',
    tab: false,
    title: 'error.notFound.title',
  },
]
