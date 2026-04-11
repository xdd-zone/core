import type { ResolvedConfig } from '@nexus/core/config'
import { prisma } from '@nexus/infra/database/client'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { assignDefaultRoleToUser } from './hooks/assign-default-role.hook'

export function createBetterAuthInstance(config: Pick<ResolvedConfig, 'auth' | 'betterAuth'>) {
  const socialProviders =
    config.auth.methods.github.enabled && config.betterAuth.providers.github
      ? {
          github: {
            clientId: config.betterAuth.providers.github.clientId,
            clientSecret: config.betterAuth.providers.github.clientSecret,
          },
        }
      : undefined

  return betterAuth({
    secret: config.betterAuth.secret,
    url: config.betterAuth.url,
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: config.auth.methods.emailPassword.enabled,
    },
    socialProviders,
    trustedOrigins: config.auth.trustedOrigins,
    databaseHooks: {
      user: {
        create: {
          after: assignDefaultRoleToUser,
        },
      },
    },
  })
}

export type BetterAuthInstance = ReturnType<typeof createBetterAuthInstance>
