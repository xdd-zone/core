import type { HealthService } from './service'

import { Elysia } from 'elysia'

import { HealthSchema } from './model'
import { HealthOpenApi } from './openapi'

export interface HealthModuleOptions {
  healthService: HealthService
}

/**
 * 健康检查模块。
 */
export function createHealthModule(options: HealthModuleOptions) {
  return new Elysia({
    name: 'health-module',
    prefix: '/health',
    tags: ['Health'],
  }).get('/', () => options.healthService.getHealth(), {
    response: HealthSchema,
    detail: HealthOpenApi.check,
  })
}
