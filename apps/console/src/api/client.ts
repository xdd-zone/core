import type { AppType } from '@xdd-zone/nexus/rpc'
import { getConsoleEnv } from '@console/env'
import { hc } from 'hono/client'

const consoleEnv = getConsoleEnv()
const nexusBaseUrl = consoleEnv.VITE_NEXUS_BASE_URL

export const nexusClient = hc<AppType>(nexusBaseUrl)

export { consoleEnv, nexusBaseUrl }
