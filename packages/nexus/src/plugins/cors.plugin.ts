import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

/**
 * 全局 CORS 插件。
 */
export const corsPlugin = new Elysia({ name: 'cors' }).use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length', 'X-Requested-With'],
    maxAge: 86400,
  }),
)
