import type { FifaRouteRecord } from '@fifa/app/router/types'

import { Login } from './pages/Login'

export const authRoutes: FifaRouteRecord[] = [
  {
    component: Login,
    id: 'login',
    menu: false,
    path: '/login',
    tab: false,
    title: 'auth.loginTitle',
  },
]
