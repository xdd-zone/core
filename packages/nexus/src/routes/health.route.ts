import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'
import { z } from 'zod'

const HealthSchema = z.object({
  status: z.literal('ok'),
})

/**
 * 基础健康检查路由。
 */
export const healthRoutes = new Elysia({ prefix: '/health' }).get(
  '/',
  () => ({
    status: 'ok' as const,
  }),
  {
    response: HealthSchema,
    detail: apiDetail({
      summary: '健康检查',
      description: '返回服务当前可用状态',
      response: HealthSchema,
    }),
  },
)
