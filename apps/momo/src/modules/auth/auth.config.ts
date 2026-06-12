import { getDb } from '#momo/infra/db/client'
import { createBetterAuthLogger, createLogger } from '#momo/infra/logger'
import { getMomoEnv } from '#momo/shared/env'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

const env = getMomoEnv()
const logger = createLogger(env)
const authLogger = logger.child({ module: 'auth' })

export const auth = betterAuth({
  appName: 'XDD Zone',
  basePath: '/api/auth',
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  logger: createBetterAuthLogger(env, authLogger),
  secret: env.BETTER_AUTH_SECRET,
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  trustedOrigins: env.CORS_ORIGINS,
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

export type MomoAuth = typeof auth
