import type { RouteObject } from 'react-router'

import type { RouteHandle } from '../types'
import { Login } from '@/pages/auth/Login'

import { Register } from '@/pages/auth/Register'

import { RouteType } from '../types'

export const loginRoutes: RouteObject[] = [
  {
    Component: Login,
    handle: {
      type: RouteType.GLOBAL,
    } satisfies RouteHandle,
    index: true,
    path: '/login',
  },
  {
    Component: Register,
    handle: {
      type: RouteType.GLOBAL,
    } satisfies RouteHandle,
    path: '/register',
  },
]
