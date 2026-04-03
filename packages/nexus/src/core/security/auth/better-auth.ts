import { AUTH_CONFIG, BETTER_AUTH_CONFIG } from '@nexus/core/config'
import { prisma } from '@nexus/infra/database/client'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { assignDefaultRoleToUser } from './hooks/assign-default-role.hook'

const socialProviders
  = AUTH_CONFIG.methods.github.enabled && BETTER_AUTH_CONFIG.github
    ? {
        github: {
          clientId: BETTER_AUTH_CONFIG.github.clientId,
          clientSecret: BETTER_AUTH_CONFIG.github.clientSecret,
        },
      }
    : undefined

/**
 * Better Auth 实例。
 */
export const betterAuthInstance = betterAuth({
  secret: BETTER_AUTH_CONFIG.secret,
  url: BETTER_AUTH_CONFIG.url,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: AUTH_CONFIG.methods.emailPassword.enabled,
  },
  socialProviders,
  trustedOrigins: BETTER_AUTH_CONFIG.trustedOrigins,
  databaseHooks: {
    user: {
      create: {
        after: assignDefaultRoleToUser,
      },
    },
  },
})
