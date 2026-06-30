import type { Hono } from 'hono'
import type { HonoEnv } from '#momo/shared/hono-env'
import { HTTPException } from 'hono/http-exception'
import { timeout } from 'hono/timeout'

const RPC_TIMEOUT_MS = 5000
const LLM_GENERATION_TIMEOUT_MS = 60000
const AUTH_TIMEOUT_MS = 10000
const LLM_GENERATION_PATH = '/rpc/content/posts/meta-suggestion'

function createTimeoutException() {
  return new HTTPException(504, {
    message: '请求处理超时',
  })
}

export function registerTimeout(app: Hono<HonoEnv>): void {
  const rpcTimeout = timeout(RPC_TIMEOUT_MS, createTimeoutException)

  app.use(LLM_GENERATION_PATH, timeout(LLM_GENERATION_TIMEOUT_MS, createTimeoutException))
  app.use('/rpc/*', async (c, next) => {
    if (c.req.path === LLM_GENERATION_PATH) {
      await next()
      return
    }

    return rpcTimeout(c, next)
  })
  app.use('/api/auth/*', timeout(AUTH_TIMEOUT_MS, createTimeoutException))
}
