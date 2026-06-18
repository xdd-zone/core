import type { Hono } from 'hono'
import type { HonoEnv } from '#momo/shared/hono-env'
import { HTTPException } from 'hono/http-exception'
import { timeout } from 'hono/timeout'

const RPC_TIMEOUT_MS = 5000
const AUTH_TIMEOUT_MS = 10000

function createTimeoutException() {
  return new HTTPException(504, {
    message: '请求处理超时',
  })
}

export function registerTimeout(app: Hono<HonoEnv>): void {
  app.use('/rpc/*', timeout(RPC_TIMEOUT_MS, createTimeoutException))
  app.use('/api/auth/*', timeout(AUTH_TIMEOUT_MS, createTimeoutException))
}
