import { Elysia } from 'elysia'
import { openapi } from '@elysiajs/openapi'
import z from 'zod'
import { OPENAPI_CONFIG } from '@/core/config'

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
