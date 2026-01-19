import type { RuntimeEnv } from './utils'
import { z } from 'zod'
import { parseRequiredEnv } from './utils'

export interface DatabaseConfig {
  connectionString: string
  logQuery: boolean
  logError: boolean
  logInfo: boolean
  logWarn: boolean
}

export function createDatabaseConfig(env: RuntimeEnv): DatabaseConfig {
  const connectionString = parseRequiredEnv(z.string().url(), process.env.DATABASE_URL)

  return {
    connectionString,
    logQuery: env.isDevelopment,
    logError: true,
    logInfo: env.isDevelopment,
    logWarn: true,
  }
}
