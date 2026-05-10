import type { Logger } from '../../infra/logger'
import { PrismaClientInitializationError, PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientValidationError } from '@nexus-prisma/generated/runtime/client'
import { describe, expect, it } from 'bun:test'
import { Elysia, t } from 'elysia'

interface MockLoggerCalls {
  childContexts: Array<Record<string, unknown>>
  debug: Array<[unknown, string]>
  info: Array<[unknown, string]>
  warn: Array<[unknown, string]>
  error: Array<[unknown, string]>
}

function createMockLogger() {
  const calls: MockLoggerCalls = {
    childContexts: [],
    debug: [],
    info: [],
    warn: [],
    error: [],
  }

  const childLogger = {
    debug(payload: unknown, message: string) {
      calls.debug.push([payload, message])
    },
    info(payload: unknown, message: string) {
      calls.info.push([payload, message])
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

async function createApp(isDevelopment = false) {
  const {
    BadRequestError,
    ConflictError,
    createErrorPlugin,
    ForbiddenError,
    HttpError,
    InternalServerError,
    NotFoundError,
    UnauthorizedError,
  } = await import('./error.plugin')

  const { baseLogger, calls } = createMockLogger()
  const config = {
    env: {
      isDevelopment,
    },
  } as Parameters<typeof createErrorPlugin>[0]

  const app = new Elysia()
    .state('requestContext', {
      requestId: 'req-test',
      startTime: Date.now() - 5,
      method: 'GET',
      path: '/from-store',
    })
    .use(createErrorPlugin(config, baseLogger))
    .get('/bad-request', () => {
      throw new BadRequestError('缺少标题', 'MISSING_TITLE')
    })
    .get('/unauthorized', () => {
      throw new UnauthorizedError('请先登录')
    })
    .get('/forbidden', () => {
      throw new ForbiddenError('权限不足')
    })
    .get('/not-found', () => {
      throw new NotFoundError('文章不存在')
    })
    .get('/unprocessable', () => {
      throw new HttpError(422, '请求参数验证失败', 'VALIDATION_FAILED')
    })
    .get('/conflict', () => {
      throw new ConflictError('邮箱已存在')
    })
    .get('/internal', () => {
      throw new InternalServerError('服务暂时不可用')
    })
    .get('/validation', ({ query }) => ({ id: query.id }), {
      query: t.Object({
        id: t.Number(),
      }),
    })
    .post('/parse', ({ body }) => body, {
      body: t.Object({
        title: t.String(),
      }),
    })
    .get('/prisma-conflict', () => {
      throw new PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test-client',
        meta: {
          target: ['email'],
        },
      })
    })
    .get('/prisma-record-not-found', () => {
      throw new PrismaClientKnownRequestError('record not found', {
        code: 'P2025',
        clientVersion: 'test-client',
      })
    })
    .get('/prisma-foreign-key', () => {
      throw new PrismaClientKnownRequestError('foreign key failed', {
        code: 'P2003',
        clientVersion: 'test-client',
      })
    })
    .get('/prisma-validation', () => {
      throw new PrismaClientValidationError('invalid prisma args', {
        clientVersion: 'test-client',
      })
    })
    .get('/prisma-init', () => {
      throw new PrismaClientInitializationError('db unavailable', 'test-client')
    })
    .get('/prisma-unknown', () => {
      throw new PrismaClientUnknownRequestError('unknown prisma failure', {
        clientVersion: 'test-client',
      })
    })
    .get('/unknown', () => {
      throw new Error('boom')
    })

  return { app, calls }
}

function expectSingleLog(calls: MockLoggerCalls, level: keyof Pick<MockLoggerCalls, 'warn' | 'error' | 'info' | 'debug'>) {
  expect(calls.childContexts).toEqual([{ module: 'error' }])
  expect(calls[level]).toHaveLength(1)
  const [payload, message] = calls[level][0]
  expect(message).toBe('request error')
  expect(payload).toMatchObject({
    duration: expect.any(Number),
    err: {
      message: expect.any(String),
    },
  })
  return payload as Record<string, unknown>
}

describe('createErrorPlugin', () => {
  const httpErrorCases = [
    {
      name: 'BadRequestError 应返回 400 标准错误体',
      path: '/bad-request',
      status: 400,
      body: {
        code: 400,
        message: '缺少标题',
        data: null,
        errorCode: 'MISSING_TITLE',
      },
      logMethod: 'warn',
    },
    {
      name: 'UnauthorizedError 应返回 401 标准错误体',
      path: '/unauthorized',
      status: 401,
      body: {
        code: 401,
        message: '请先登录',
        data: null,
        errorCode: 'UNAUTHORIZED',
      },
      logMethod: 'warn',
    },
    {
      name: 'ForbiddenError 应返回 403 标准错误体',
      path: '/forbidden',
      status: 403,
      body: {
        code: 403,
        message: '权限不足',
        data: null,
        errorCode: 'FORBIDDEN',
      },
      logMethod: 'warn',
    },
    {
      name: 'NotFoundError 应返回 404 标准错误体',
      path: '/not-found',
      status: 404,
      body: {
        code: 404,
        message: '文章不存在',
        data: null,
        errorCode: 'NOT_FOUND',
      },
      logMethod: 'warn',
    },
    {
      name: 'HttpError 422 应返回 422 标准错误体',
      path: '/unprocessable',
      status: 422,
      body: {
        code: 422,
        message: '请求参数验证失败',
        data: null,
        errorCode: 'VALIDATION_FAILED',
      },
      logMethod: 'warn',
    },
    {
      name: 'ConflictError 应返回 409 标准错误体',
      path: '/conflict',
      status: 409,
      body: {
        code: 409,
        message: '邮箱已存在',
        data: null,
        errorCode: 'CONFLICT',
      },
      logMethod: 'warn',
    },
    {
      name: 'InternalServerError 应返回 500 标准错误体',
      path: '/internal',
      status: 500,
      body: {
        code: 500,
        message: '服务暂时不可用',
        data: null,
        errorCode: 'INTERNAL_ERROR',
      },
      logMethod: 'error',
    },
  ] as const

  for (const testCase of httpErrorCases) {
    it(testCase.name, async () => {
      const { app, calls } = await createApp()
      const response = await app.handle(new Request(`http://localhost${testCase.path}`))

      expect(response.status).toBe(testCase.status)
      expect(response.headers.get('content-type')).toContain('application/json')
      expect(await response.json()).toEqual(testCase.body)

      const payload = expectSingleLog(calls, testCase.logMethod)
      expect(payload.err).toMatchObject({
        message: testCase.body.message,
        code: testCase.body.errorCode,
      })
    })
  }

  it('VALIDATION 分支应返回 422、结构化 details，并记录 warn 日志', async () => {
    const { app, calls } = await createApp()
    const response = await app.handle(new Request('http://localhost/validation?id=bad'))
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body).toMatchObject({
      code: 422,
      message: '请求参数验证失败',
      data: null,
      errorCode: 'VALIDATION',
      details: {
        errors: [
          expect.objectContaining({
            field: '/id',
            message: expect.any(String),
          }),
        ],
      },
    })

    const payload = expectSingleLog(calls, 'warn')
    const err = payload.err as Record<string, unknown>
    expect(err.code).toBe('VALIDATION')
    expect(err.message).toBeTruthy()
    expect(err.name).toBe('Error')
  })

  it('PARSE 分支在生产环境应返回 400 且不暴露 details，并记录 warn 日志', async () => {
    const { app, calls } = await createApp(false)
    const response = await app.handle(
      new Request('http://localhost/parse', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: '{"title":',
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      code: 400,
      message: '请求体解析失败',
      data: null,
      errorCode: 'PARSE_ERROR',
    })

    const payload = expectSingleLog(calls, 'warn')
    expect(payload.err).toMatchObject({
      code: 'PARSE',
    })
  })

  it('PARSE 分支在开发环境应返回 details.message', async () => {
    const { app, calls } = await createApp(true)
    const response = await app.handle(
      new Request('http://localhost/parse', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: '{"title":',
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      code: 400,
      message: '请求体解析失败',
      data: null,
      errorCode: 'PARSE_ERROR',
      details: {
        message: 'Bad Request',
      },
    })

    expectSingleLog(calls, 'warn')
  })

  it('Elysia 原生 NOT_FOUND 分支应返回 404 标准错误体', async () => {
    const { app, calls } = await createApp(false)
    const response = await app.handle(new Request('http://localhost/missing-route'))

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toEqual({
      code: 404,
      message: '请求的资源不存在',
      data: null,
      errorCode: 'NOT_FOUND',
    })

    const payload = expectSingleLog(calls, 'warn')
    expect(payload.err).toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('Prisma P2002 分支应映射为 409、PRISMA_P2002 和 warn 日志', async () => {
    const { app, calls } = await createApp(false)
    const response = await app.handle(new Request('http://localhost/prisma-conflict'))

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      code: 409,
      message: '邮箱已存在',
      data: null,
      errorCode: 'PRISMA_P2002',
      details: {
        prisma: {
          code: 'P2002',
        },
      },
    })

    const payload = expectSingleLog(calls, 'warn')
    const err = payload.err as Record<string, unknown>
    expect(err.prismaCode).toBe('P2002')
    expect(err.code).toBe('P2002')
    expect(err.name).toBe('PrismaClientKnownRequestError')
  })

  it('Prisma P2025 分支应映射为 404、PRISMA_P2025 和 warn 日志', async () => {
    const { app, calls } = await createApp(false)
    const response = await app.handle(new Request('http://localhost/prisma-record-not-found'))

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      code: 404,
      message: '记录不存在',
      data: null,
      errorCode: 'PRISMA_P2025',
      details: {
        prisma: {
          code: 'P2025',
        },
      },
    })

    const payload = expectSingleLog(calls, 'warn')
    const err = payload.err as Record<string, unknown>
    expect(err.prismaCode).toBe('P2025')
    expect(err.code).toBe('P2025')
    expect(err.name).toBe('PrismaClientKnownRequestError')
  })

  it('Prisma P2003 分支应映射为 409、PRISMA_P2003 和 warn 日志', async () => {
    const { app, calls } = await createApp(false)
    const response = await app.handle(new Request('http://localhost/prisma-foreign-key'))

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      code: 409,
      message: '关联数据不存在或约束冲突',
      data: null,
      errorCode: 'PRISMA_P2003',
      details: {
        prisma: {
          code: 'P2003',
        },
      },
    })

    const payload = expectSingleLog(calls, 'warn')
    const err = payload.err as Record<string, unknown>
    expect(err.prismaCode).toBe('P2003')
    expect(err.code).toBe('P2003')
    expect(err.name).toBe('PrismaClientKnownRequestError')
  })

  it('Prisma Validation 分支在开发环境应返回 details 并记录 error 日志', async () => {
    const { app, calls } = await createApp(true)
    const response = await app.handle(new Request('http://localhost/prisma-validation'))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      code: 400,
      message: '数据库参数校验失败',
      data: null,
      errorCode: 'PRISMA_VALIDATION',
      details: {
        prisma: {
          name: 'PrismaClientValidationError',
          message: 'invalid prisma args',
        },
      },
    })

    expectSingleLog(calls, 'error')
  })

  it('Prisma Initialization 分支在生产环境不应暴露 details，并记录 error 日志', async () => {
    const { app, calls } = await createApp(false)
    const response = await app.handle(new Request('http://localhost/prisma-init'))

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      code: 503,
      message: '数据库连接失败',
      data: null,
      errorCode: 'PRISMA_INIT_FAILED',
    })

    expectSingleLog(calls, 'error')
  })

  it('Prisma Unknown 分支应映射为 500、PRISMA_UNKNOWN，并记录 error 日志', async () => {
    const { app, calls } = await createApp(true)
    const response = await app.handle(new Request('http://localhost/prisma-unknown'))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      code: 500,
      message: '数据库请求失败',
      data: null,
      errorCode: 'PRISMA_UNKNOWN',
      details: {
        prisma: {
          name: 'PrismaClientUnknownRequestError',
          message: 'unknown prisma failure',
        },
      },
    })

    expectSingleLog(calls, 'error')
  })

  it('未知异常在生产环境应返回 500 且不暴露 details', async () => {
    const { app, calls } = await createApp(false)
    const response = await app.handle(new Request('http://localhost/unknown'))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      code: 500,
      message: '服务器内部错误',
      data: null,
      errorCode: 'INTERNAL_ERROR',
    })

    expectSingleLog(calls, 'error')
  })

  it('未知异常在开发环境应返回 details.name 和 details.stack', async () => {
    const { app, calls } = await createApp(true)
    const response = await app.handle(new Request('http://localhost/unknown'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toMatchObject({
      code: 500,
      message: '服务器内部错误',
      data: null,
      errorCode: 'INTERNAL_ERROR',
      details: {
        name: 'Error',
        stack: expect.any(String),
      },
    })

    const payload = expectSingleLog(calls, 'error')
    expect(payload.err).toMatchObject({
      name: 'Error',
      stack: expect.any(String),
    })
  })
})
