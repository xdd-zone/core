import type { FifaRouteRecord } from './types'

import { errorRoutes } from '@fifa/features/errors/routes'
import { exampleRoutes } from '@fifa/features/examples/routes'
import { homeRoutes } from '@fifa/features/home/routes'

export const fifaRouteRecords: FifaRouteRecord[] = [...homeRoutes, ...exampleRoutes, ...errorRoutes]

export const homeRouteRecord = homeRoutes[0]
