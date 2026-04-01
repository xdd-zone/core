import { BETTER_AUTH_CONFIG } from '@nexus/core/config'
import { prisma } from '@nexus/infra'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { assignDefaultRoleToUser } from './hooks/assign-default-role.hook'

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
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: BETTER_AUTH_CONFIG.github.clientId,
      clientSecret: BETTER_AUTH_CONFIG.github.clientSecret,
    },
  },
  trustedOrigins: BETTER_AUTH_CONFIG.trustedOrigins,
  databaseHooks: {
    user: {
      create: {
        after: assignDefaultRoleToUser,
      },
    },
  },
})
