import type { ResolvedConfig } from '@nexus/core/config'
import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'
import z from 'zod'

/**
 * OpenAPI 文档插件。
 */
export function createOpenapiPlugin(config: ResolvedConfig) {
  return new Elysia({ name: 'openapi' }).use(
    openapi({
      enabled: config.openapi.enabled,
      path: config.openapi.path,
      documentation: {
        info: {
          title: config.openapi.title,
          description: config.openapi.description,
          version: config.openapi.version,
        },
      },
      mapJsonSchema: {
        zod: z.toJSONSchema,
      },
    }),
  )
}
