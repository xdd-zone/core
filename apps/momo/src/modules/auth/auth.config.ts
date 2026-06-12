import type { MomoRuntime } from '#momo/bootstrap'
import { getDb } from '#momo/infra/db/client'
import { createBetterAuthLogger, createChildLogger } from '#momo/infra/logger'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

export function createMomoAuth(runtime: MomoRuntime) {
  const authLogger = createChildLogger(runtime.logger, 'auth')

  return betterAuth({
    appName: 'XDD Zone',
    basePath: '/api/auth',
    baseURL: runtime.env.BETTER_AUTH_URL,
    database: drizzleAdapter(getDb(), {
      provider: 'pg',
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    logger: createBetterAuthLogger(runtime.env, authLogger),
    secret: runtime.env.BETTER_AUTH_SECRET,
    socialProviders: {
      github: {
        clientId: runtime.env.GITHUB_CLIENT_ID,
        clientSecret: runtime.env.GITHUB_CLIENT_SECRET,
      },
      google: {
        clientId: runtime.env.GOOGLE_CLIENT_ID,
        clientSecret: runtime.env.GOOGLE_CLIENT_SECRET,
      },
    },
    trustedOrigins: runtime.env.CORS_ORIGINS,
    user: {
      additionalFields: {
        status: {
          defaultValue: 'active',
          input: false,
          required: false,
          type: 'string',
        },
      },
    },
  })
}

export type MomoAuth = ReturnType<typeof createMomoAuth>
