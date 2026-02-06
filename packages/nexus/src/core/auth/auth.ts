import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@/infra'
import { BETTER_AUTH_CONFIG } from '../config'
import { assignDefaultRoleToUser } from './hooks/assign-default-role.hook'

export const auth = betterAuth({
  // 基础配置
  secret: BETTER_AUTH_CONFIG.secret,
  url: BETTER_AUTH_CONFIG.url,

  // 数据库配置
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  // 认证方式配置
  emailAndPassword: {
    enabled: true,
  },

  // 社交登录
  socialProviders: {},

  // 安全配置 - 允许的来源
  trustedOrigins: BETTER_AUTH_CONFIG.trustedOrigins,

  // 数据库钩子 - 自动为用户分配默认角色
  databaseHooks: {
    user: {
      create: {
        after: assignDefaultRoleToUser,
      },
    },
  },
})
