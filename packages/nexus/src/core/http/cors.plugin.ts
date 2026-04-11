import type { ResolvedConfig } from '@nexus/core/config'
import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

/**
 * 全局 CORS 插件。
 */
export function createCorsPlugin(config: ResolvedConfig) {
  if (!config.http.cors.enabled) {
    return new Elysia({ name: 'cors' })
  }

  return new Elysia({ name: 'cors' }).use(
    cors({
      origin: config.http.cors.origins,
      methods: config.http.cors.methods,
      credentials: config.http.cors.allowCredentials,
      allowedHeaders: config.http.cors.allowedHeaders,
      exposeHeaders: config.http.cors.exposedHeaders,
      maxAge: config.http.cors.maxAge,
    }),
  )
}
