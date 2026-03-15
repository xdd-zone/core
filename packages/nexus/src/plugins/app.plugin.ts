import type { Elysia } from 'elysia'
import { errorPlugin } from '@/core/plugins'
import { corsPlugin } from './cors.plugin'
import { openapiPlugin } from './openapi.plugin'
import { requestLoggerPlugin } from './request-logger.plugin'

/**
 * 应用级全局插件。
 */
export function setupAppPlugin(app: Elysia): Elysia {
  return app.use(corsPlugin).use(openapiPlugin).use(errorPlugin).use(requestLoggerPlugin) as unknown as Elysia
}
