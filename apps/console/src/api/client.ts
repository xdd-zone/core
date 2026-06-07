import type { AppType } from '@xdd-zone/nexus'
import { hc } from 'hono/client'

const nexusBaseUrl = import.meta.env.VITE_NEXUS_BASE_URL ?? 'http://localhost:7788'

export const nexusClient = hc<AppType>(nexusBaseUrl)

export { nexusBaseUrl }
