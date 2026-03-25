import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'
import { HealthSchema } from './model'

/**
 * 健康检查模块。
 */
export const healthModule = new Elysia({
  name: 'health-module',
  prefix: '/health',
  tags: ['Health'],
}).get(
  '/',
  () => ({
    status: 'ok' as const,
  }),
  {
    response: HealthSchema,
    detail: apiDetail({
      summary: '健康检查',
      description: '返回服务当前可用状态。',
      response: HealthSchema,
    }),
  },
)

export * from './model'
