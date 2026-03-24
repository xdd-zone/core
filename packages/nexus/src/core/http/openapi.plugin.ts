import { openapi } from '@elysiajs/openapi'
import { OPENAPI_CONFIG } from '@nexus/core/config'
import { Elysia } from 'elysia'
import z from 'zod'

/**
 * OpenAPI 文档插件。
 */
export const openapiPlugin = new Elysia({ name: 'openapi' }).use(
  openapi({
    enabled: OPENAPI_CONFIG.enabled,
    path: OPENAPI_CONFIG.path,
    documentation: {
      info: {
        title: OPENAPI_CONFIG.title,
        description: OPENAPI_CONFIG.description,
        version: OPENAPI_CONFIG.version,
      },
    },
    mapJsonSchema: {
      zod: z.toJSONSchema,
    },
  }),
)
