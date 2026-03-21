import type { Elysia } from 'elysia'
import { corsPlugin } from './cors.plugin'
import { errorPlugin } from './error.plugin'
import { openapiPlugin } from './openapi.plugin'
import { requestLoggerPlugin } from './request-logger.plugin'

/**
 * 应用级全局插件。
 */
export function setupAppPlugin<const TApp extends Elysia>(app: TApp) {
  return app.use(corsPlugin).use(openapiPlugin).use(errorPlugin).use(requestLoggerPlugin)
}
