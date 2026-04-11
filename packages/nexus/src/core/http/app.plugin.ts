import type { ResolvedConfig } from '@nexus/core/config'
import type { Logger } from '@nexus/infra/logger'
import type { Elysia } from 'elysia'
import { logger as defaultLogger } from '@nexus/infra/logger'
import { createCorsPlugin } from './cors.plugin'
import { createErrorPlugin } from './error.plugin'
import { createOpenapiPlugin } from './openapi.plugin'
import { createRequestLoggerPlugin } from './request-logger.plugin'

/**
 * 应用级全局插件。
 */
export function setupAppPlugin<const TApp extends Elysia>(
  app: TApp,
  config: ResolvedConfig,
  logger: Logger = defaultLogger,
) {
  const base = app.use(createCorsPlugin(config)).use(createOpenapiPlugin(config)).use(createErrorPlugin(config, logger))

  return config.http.requestLogger.enabled ? base.use(createRequestLoggerPlugin(logger)) : base
}
