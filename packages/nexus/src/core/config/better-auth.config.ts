import { z } from 'zod'
import { parseRequiredEnv, parseOptionalEnv } from './utils'
import type { YamlConfig } from './utils'

export interface BetterAuthConfig {
  secret: string
  url: string
  trustedOrigins: string[]
}

export function createBetterAuthConfig(env: Record<string, unknown>, yamlConfig: YamlConfig): BetterAuthConfig {
  const secret = parseRequiredEnv(z.string().min(1), process.env.BETTER_AUTH_SECRET)
  const url = parseRequiredEnv(z.string().url(), process.env.BETTER_AUTH_URL)
  const trustedOrigins = parseOptionalEnv(z.array(z.string().url()), yamlConfig.trustedOrigins) ?? [
    'http://localhost:2233',
    'http://localhost:7788',
  ]

  return {
    secret,
    url,
    trustedOrigins,
  }
}
