import type { FifaRouteRecord } from './types'

import { authRoutes } from '@fifa/features/auth/routes'
import { errorRoutes } from '@fifa/features/errors/routes'
import { exampleRoutes } from '@fifa/features/examples/routes'
import { homeRoutes } from '@fifa/features/home/routes'

export const appRouteRecords: FifaRouteRecord[] = [...homeRoutes, ...exampleRoutes, ...errorRoutes]

export const authRouteRecords: FifaRouteRecord[] = authRoutes

export const fifaRouteRecords: FifaRouteRecord[] = [...authRouteRecords, ...appRouteRecords]

export const homeRouteRecord = homeRoutes[0]
