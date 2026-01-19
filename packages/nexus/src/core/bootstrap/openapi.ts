/**
 * OpenAPI 文档启动器
 * 配置 Swagger/OpenAPI 文档生成
 */
import type { Elysia } from 'elysia'
import { openapi } from '@elysiajs/openapi'
import z from 'zod'
import { OPENAPI_CONFIG } from '@/core/config'

export function setupOpenAPI(app: Elysia) {
  app.use(
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

  return app
}
