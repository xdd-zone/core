import type { HealthService } from './service'
import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'
import { HealthSchema } from './model'

/**
 * 健康检查模块。
 */
export function createHealthModule(options: { healthService: HealthService }) {
  return new Elysia({
    name: 'health-module',
    prefix: '/health',
    tags: ['Health'],
  }).get(
    '/',
    () => options.healthService.getHealth(),
    {
      response: HealthSchema,
      detail: apiDetail({
        summary: '健康检查',
        description: '返回服务当前可用状态与数据库依赖状态。',
        response: HealthSchema,
      }),
    },
  )
}

export * from './model'
export * from './service'
