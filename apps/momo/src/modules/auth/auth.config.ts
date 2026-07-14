import type { MomoRuntime } from '#momo/bootstrap'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDb } from '#momo/infra/db/client'
import { userProfiles } from '#momo/infra/db/schema/index'
import { createBetterAuthLogger, createChildLogger } from '#momo/infra/logger'

const AUTH_BASE_PATH = '/api/auth'

export function createMomoAuth(runtime: Pick<MomoRuntime, 'env' | 'logger'>) {
  const authLogger = createChildLogger(runtime.logger, 'auth')

  return betterAuth({
    appName: 'XDD Zone',
    basePath: AUTH_BASE_PATH,
    baseURL: runtime.env.BETTER_AUTH_URL,
    database: drizzleAdapter(getDb(), {
      provider: 'pg',
    }),
    databaseHooks: {
      user: {
        create: {
          async after(user) {
            await getDb()
              .insert(userProfiles)
              .values({
                avatarUrl: typeof user.image === 'string' ? user.image : null,
                displayName: user.name,
                userId: user.id,
              })
              .onConflictDoNothing()
          },
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['github', 'google'],
        updateUserInfoOnLink: false,
      },
    },
    logger: createBetterAuthLogger(runtime.env, authLogger),
    rateLimit: {
      enabled: runtime.env.APP_ENV !== 'test',
      max: 100,
      storage: 'database',
      window: 10,
      customRules: {
        '/api/auth/sign-in/email': {
          max: 5,
          window: 60,
        },
        '/api/auth/sign-up/email': {
          max: 3,
          window: 60,
        },
      },
    },
    secret: runtime.env.BETTER_AUTH_SECRET,
    socialProviders: {
      ...(runtime.env.GITHUB_CLIENT_ID && runtime.env.GITHUB_CLIENT_SECRET
        ? {
            github: {
              clientId: runtime.env.GITHUB_CLIENT_ID,
              clientSecret: runtime.env.GITHUB_CLIENT_SECRET,
            },
          }
        : {}),
      ...(runtime.env.GOOGLE_CLIENT_ID && runtime.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: runtime.env.GOOGLE_CLIENT_ID,
              clientSecret: runtime.env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {}),
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
