import type { ConsoleRouteRecord } from './types'

import { errorRoutes } from '@console/features/errors/routes'
import { exampleRoutes } from '@console/features/examples/routes'
import { homeRoutes } from '@console/features/home/routes'

export const consoleRouteRecords: ConsoleRouteRecord[] = [...homeRoutes, ...exampleRoutes, ...errorRoutes]

export const homeRouteRecord = homeRoutes[0]
