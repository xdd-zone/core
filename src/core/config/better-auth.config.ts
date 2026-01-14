import { z } from 'zod'
import { parseRequiredEnv } from './utils'

export interface BetterAuthConfig {
  secret: string
  url: string
}

export function createBetterAuthConfig(): BetterAuthConfig {
  const secret = parseRequiredEnv(z.string().min(1), process.env.BETTER_AUTH_SECRET)
  const url = parseRequiredEnv(z.string().url(), process.env.BETTER_AUTH_URL)

  return {
    secret,
    url,
  }
}
