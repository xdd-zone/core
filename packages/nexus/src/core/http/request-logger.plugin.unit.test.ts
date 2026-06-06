import type { Logger } from '../../infra/logger'
import { describe, expect, it } from 'bun:test'
import { Elysia, t } from 'elysia'

interface MockLoggerCalls {
  childContexts: Array<Record<string, unknown>>
  debug: Array<[unknown, string]>
  info: Array<[unknown, string]>
  warn: Array<[unknown, string]>
  error: Array<[unknown, string]>
  waitForInfoMessage: (message: string) => Promise<void>
}

function createMockLogger() {
  const infoWaiters = new Map<string, Array<() => void>>()
  const calls: MockLoggerCalls = {
    childContexts: [],
    debug: [],
    info: [],
    warn: [],
    error: [],
    waitForInfoMessage(message: string) {
      if (calls.info.some(([, currentMessage]) => currentMessage === message)) return Promise.resolve()

      return new Promise((resolve) => {
        const waiters = infoWaiters.get(message) ?? []
        waiters.push(resolve)
        infoWaiters.set(message, waiters)
      })
    },
  }

  const childLogger = {
    debug(payload: unknown, message: string) {
      calls.debug.push([payload, message])
    },
    info(payload: unknown, message: string) {
      calls.info.push([payload, message])
      const waiters = infoWaiters.get(message) ?? []
      infoWaiters.delete(message)
      for (const resolve of waiters) resolve()
    },
    warn(payload: unknown, message: string) {
      calls.warn.push([payload, message])
    },
    error(payload: unknown, message: string) {
      calls.error.push([payload, message])
    },
  }

  const baseLogger = {
    child(context: Record<string, unknown>) {
      calls.childContexts.push(context)
      return childLogger
    },
  } as unknown as Logger

  return {
    baseLogger,
    calls,
  }
}

async function createApp() {
  const { createErrorPlugin, ForbiddenError, HttpError, UnauthorizedError } = await import('./error.plugin')
  const { createRequestLoggerPlugin } = await import('./request-logger.plugin')
  const { baseLogger, calls } = createMockLogger()
  const app = new Elysia()
    .use(
      createErrorPlugin(
        {
          env: {
            nodeEnv: 'test',
            isDevelopment: false,
            isTest: true,
            isProduction: false,
          },
        },
        baseLogger,
      ),
    )
    .use(createRequestLoggerPlugin(baseLogger))
    .get('/posts', () => ({ ok: true }))
    .get('/auth', () => {
      throw new UnauthorizedError('请先登录')
    })
    .get('/forbidden', () => {
      throw new ForbiddenError('权限不足')
    })
    .get('/validation', ({ query }) => ({ id: query.id }), {
      query: t.Object({
        id: t.Number(),
      }),
    })
    .get('/http-error', () => {
      throw new HttpError(418, '拒绝访问茶壶', 'TEAPOT')
    })
    .get('/unknown-error', () => {
      throw new Error('boom')
    })

  return { app, calls }
}

async function expectRequestLifecycleLogs(
  calls: MockLoggerCalls,
  expected: { path: string; status: number; query?: string },
) {
  await calls.waitForInfoMessage('request completed')
  expect(calls.childContexts).toEqual([{ module: 'error' }, { module: 'http' }])
  expect(calls.info).toHaveLength(2)

  const [startPayload, startMessage] = calls.info[0]
  expect(startMessage).toBe('request start')
  expect(startPayload).toMatchObject({
    method: 'GET',
    path: expected.path,
    query: expected.query,
    requestId: expect.any(String),
  })

  const [endPayload, endMessage] = calls.info[1]
  expect(endMessage).toBe('request completed')
  expect(endPayload).toMatchObject({
    method: 'GET',
    path: expected.path,
    status: expected.status,
    duration: expect.any(Number),
    requestId: (startPayload as { requestId: string }).requestId,
  })

  const endRecord = endPayload as Record<string, unknown>
  expect('duration' in endRecord).toBe(true)
}

describe('createRequestLoggerPlugin', () => {
  it('200 成功请求应记录开始和完成日志', async () => {
    const { app, calls } = await createApp()

    const response = await app.handle(
      new Request('http://localhost/posts?page=2', {
        headers: {
          'user-agent': 'bun-test',
          'x-forwarded-for': '203.0.113.10, 10.0.0.1',
        },
      }),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    await expectRequestLifecycleLogs(calls, {
      path: '/posts',
      query: '?page=2',
      status: 200,
    })

    expect(calls.info[0]?.[0]).toMatchObject({
      ip: '203.0.113.10',
      userAgent: 'bun-test',
    })
  })

  it('401 未登录请求也应记录完成日志', async () => {
    const { app, calls } = await createApp()

    const response = await app.handle(new Request('http://localhost/auth'))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      code: 401,
      message: '请先登录',
      data: null,
      errorCode: 'UNAUTHORIZED',
    })
    await expectRequestLifecycleLogs(calls, {
      path: '/auth',
      status: 401,
    })
  })

  it('403 无权限请求也应记录完成日志', async () => {
    const { app, calls } = await createApp()

    const response = await app.handle(new Request('http://localhost/forbidden'))

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      code: 403,
      message: '权限不足',
      data: null,
      errorCode: 'FORBIDDEN',
    })
    await expectRequestLifecycleLogs(calls, {
      path: '/forbidden',
      status: 403,
    })
  })

  it('422 参数校验失败请求也应记录完成日志', async () => {
    const { app, calls } = await createApp()

    const response = await app.handle(new Request('http://localhost/validation?id=bad'))

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      code: 422,
      message: '请求参数验证失败',
      data: null,
      errorCode: 'VALIDATION',
      details: {
        errors: expect.any(Array),
      },
    })
    await expectRequestLifecycleLogs(calls, {
      path: '/validation',
      query: '?id=bad',
      status: 422,
    })
  })

  it('handler 抛 HttpError 也应记录完成日志', async () => {
    const { app, calls } = await createApp()

    const response = await app.handle(new Request('http://localhost/http-error'))

    expect(response.status).toBe(418)
    expect(await response.json()).toEqual({
      code: 418,
      message: '拒绝访问茶壶',
      data: null,
      errorCode: 'TEAPOT',
    })
    await expectRequestLifecycleLogs(calls, {
      path: '/http-error',
      status: 418,
    })
  })

  it('handler 抛未知异常也应记录完成日志', async () => {
    const { app, calls } = await createApp()

    const response = await app.handle(new Request('http://localhost/unknown-error'))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      code: 500,
      message: '服务器内部错误',
      data: null,
      errorCode: 'INTERNAL_ERROR',
    })
    await expectRequestLifecycleLogs(calls, {
      path: '/unknown-error',
      status: 500,
    })
  })
})
