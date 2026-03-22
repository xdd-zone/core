import type { RuntimeEnv, YamlConfig  } from './utils'
import { z } from 'zod'
import { parseOptionalEnv, parseRequiredEnv } from './utils'

export interface BetterAuthConfig {
  secret: string
  url: string
  trustedOrigins: string[]
}

const RECOMMENDED_SECRET_LENGTH = 32

function warnWeakBetterAuthSecret(secret: string, env: RuntimeEnv) {
  if (!env.isDevelopment) {
    return
  }

  if (secret.length >= RECOMMENDED_SECRET_LENGTH) {
    return
  }

  console.warn(
    `[better-auth] BETTER_AUTH_SECRET 长度建议至少 ${RECOMMENDED_SECRET_LENGTH} 个字符，当前为 ${secret.length}，开发环境将持续出现强度告警。`,
  )
}

export function createBetterAuthConfig(env: RuntimeEnv, yamlConfig: YamlConfig): BetterAuthConfig {
  const secret = parseRequiredEnv(z.string().min(1), process.env.BETTER_AUTH_SECRET)
  const url = parseRequiredEnv(z.string().url(), process.env.BETTER_AUTH_URL)
  const trustedOrigins = parseOptionalEnv(z.array(z.string().url()), yamlConfig.trustedOrigins) ?? [
    'http://localhost:2333',
    'http://localhost:2233',
    'http://localhost:7788',
  ]

  warnWeakBetterAuthSecret(secret, env)

  return {
    secret,
    url,
    trustedOrigins,
  }
}
