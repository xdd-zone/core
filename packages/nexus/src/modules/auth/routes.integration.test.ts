import { prisma } from '@nexus/infra/database'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import {
  cleanupTestData,
  createCookieFetcher,
  createTestApp,
  createTestRequest,
  createTestSuffix,
  expectErrorResponse,
  expectNoBody,
  readJson,
  seedBasePermissions,
} from '../../test'

const { app, context } = createTestApp({
  config: {
    auth: {
      methods: {
        emailPassword: {
          enabled: true,
          allowSignUp: true,
        },
      },
    },
  },
})

const createdUserIds: string[] = []

interface OpenApiParameter {
  in: string
  name: string
  required?: boolean
}

interface OpenApiSchema {
  properties?: Record<string, OpenApiSchema | unknown>
  required?: string[]
}

interface OpenApiRequestBody {
  content?: Record<string, { schema?: OpenApiSchema }>
  required?: boolean
}

interface OpenApiResponse {
  content?: Record<string, { schema?: OpenApiSchema }>
}

interface OpenApiOperation {
  parameters?: OpenApiParameter[]
  requestBody?: OpenApiRequestBody
  responses?: Record<string, OpenApiResponse>
  tags?: string[]
}

interface OpenApiPath {
  get?: OpenApiOperation
  post?: OpenApiOperation
}

interface OpenApiDocument {
  paths?: Record<string, OpenApiPath>
}

function jsonRequest(path: string, body?: unknown, init: RequestInit = {}) {
  return new Request(new URL(path, 'http://localhost'), {
    ...init,
    body: body === undefined ? init.body : JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      ...init.headers,
    },
  })
}

async function postJsonWithCookies(path: string, body: unknown, fetcher: typeof fetch) {
  return await fetcher(new URL(path, 'http://localhost'), {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
  })
}

async function getOpenApiDocument() {
  const response = await app.handle(createTestRequest('/openapi/json'))

  expect(response.status).toBe(200)

  return await readJson<OpenApiDocument>(response)
}

function jsonSchema(operation: OpenApiOperation | undefined, status = '200') {
  return operation?.responses?.[status]?.content?.['application/json']?.schema
}

function jsonRequestSchema(operation: OpenApiOperation | undefined) {
  return operation?.requestBody?.content?.['application/json']?.schema
}

beforeAll(async () => {
  await seedBasePermissions(prisma)
})

afterAll(async () => {
  await cleanupTestData({ userIds: createdUserIds }, prisma)
})

describe('auth routes', () => {
  it('挂载到顶层 app 后应导出 Auth 路径和 OpenAPI schema', async () => {
    const document = await getOpenApiDocument()
    const paths = document.paths ?? {}
    const methods = paths['/api/auth/methods']?.get
    const signInGithub = paths['/api/auth/sign-in/github']?.get
    const signUpEmail = paths['/api/auth/sign-up/email']?.post
    const signInEmail = paths['/api/auth/sign-in/email']?.post
    const signOut = paths['/api/auth/sign-out']?.post
    const getSession = paths['/api/auth/get-session']?.get
    const me = paths['/api/auth/me']?.get

    expect(methods?.tags).toContain('Auth')
    expect(signInGithub?.tags).toContain('Auth')
    expect(signUpEmail?.tags).toContain('Auth')
    expect(signInEmail?.tags).toContain('Auth')
    expect(signOut?.tags).toContain('Auth')
    expect(getSession?.tags).toContain('Auth')
    expect(me?.tags).toContain('Auth')

    expect(jsonSchema(methods)?.properties).toHaveProperty('methods')
    expect(signInGithub?.parameters).toEqual(
      expect.arrayContaining([expect.objectContaining({ in: 'query', name: 'callbackURL', required: false })]),
    )
    expect(signInGithub?.responses).toHaveProperty('302')
    expect(signInGithub?.responses).toHaveProperty('400')
    expect(jsonRequestSchema(signUpEmail)?.required).toEqual(expect.arrayContaining(['email', 'password', 'name']))
    expect(jsonRequestSchema(signUpEmail)?.properties).toEqual(
      expect.objectContaining({
        email: expect.any(Object),
        image: expect.any(Object),
        name: expect.any(Object),
        password: expect.any(Object),
      }),
    )
    expect(jsonRequestSchema(signInEmail)?.required).toEqual(expect.arrayContaining(['email', 'password']))
    expect(jsonRequestSchema(signInEmail)?.properties).toEqual(
      expect.objectContaining({
        email: expect.any(Object),
        password: expect.any(Object),
        rememberMe: expect.any(Object),
      }),
    )
    expect(jsonSchema(signUpEmail)?.properties).toHaveProperty('user')
    expect(jsonSchema(signInEmail)?.properties).toHaveProperty('user')
    expect(signOut?.responses).toHaveProperty('204')
    expect(jsonSchema(getSession)?.required).toEqual(expect.arrayContaining(['user', 'session', 'isAuthenticated']))
    expect(jsonSchema(me)?.required).toEqual(expect.arrayContaining(['user', 'session', 'isAuthenticated']))
  })

  it('GET /methods 返回当前登录方式', async () => {
    const response = await app.handle(jsonRequest('/api/auth/methods'))
    const body = await readJson<{
      methods: Array<{
        id: string
        enabled: boolean
        allowSignUp: boolean
      }>
    }>(response)

    expect(response.status).toBe(200)
    expect(body.methods).toContainEqual(
      expect.objectContaining({
        id: 'emailPassword',
        enabled: true,
        allowSignUp: true,
      }),
    )
    expect(body.methods).toContainEqual(
      expect.objectContaining({
        id: 'github',
        enabled: context.config.auth.methods.github.enabled,
        allowSignUp: context.config.auth.methods.github.allowSignUp,
      }),
    )
  })

  it('GET /sign-in/github 返回 302 和 Location', async () => {
    const response = await app.handle(
      createTestRequest(
        '/api/auth/sign-in/github?callbackURL=http%3A%2F%2Flocalhost%3A2333%2Fdashboard',
        {
          headers: {
            referer: 'http://localhost:2333/login?redirect=%2Fdashboard',
          },
        },
        {
          baseUrl: context.config.betterAuth.url,
        },
      ),
    )

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBeTruthy()
  })

  it('GET /get-session 匿名访问返回未登录', async () => {
    const response = await app.handle(jsonRequest('/api/auth/get-session'))

    expect(response.status).toBe(200)
    await expect(readJson(response)).resolves.toEqual({
      user: null,
      session: null,
      isAuthenticated: false,
    })
  })

  it('GET /me 未登录返回 401', async () => {
    const response = await app.handle(jsonRequest('/api/auth/me'))

    await expectErrorResponse(response, {
      status: 401,
      message: '请先登录',
    })
  })

  it('邮箱注册和登录会写入登录态', async () => {
    const suffix = createTestSuffix('auth-route')
    const password = 'auth-route-pass-123'
    const signUpSession = createCookieFetcher(app)

    const signUpResponse = await postJsonWithCookies(
      '/api/auth/sign-up/email',
      {
        email: `${suffix}@example.com`,
        password,
        name: `Auth Route ${suffix}`,
      },
      signUpSession.fetcher,
    )
    const signUpBody = await readJson<{ user: { id: string; email: string | null | undefined } }>(signUpResponse)
    createdUserIds.push(signUpBody.user.id)

    expect(signUpResponse.status).toBe(200)
    expect(signUpBody.user.email).toBe(`${suffix}@example.com`)

    const signInSession = createCookieFetcher(app)
    const signInResponse = await postJsonWithCookies(
      '/api/auth/sign-in/email',
      {
        email: `${suffix}@example.com`,
        password,
      },
      signInSession.fetcher,
    )
    const signInBody = await readJson<{ user: { id: string } }>(signInResponse)

    expect(signInResponse.status).toBe(200)
    expect(signInBody.user.id).toBe(signUpBody.user.id)

    const meResponse = await signInSession.fetcher(new URL('/api/auth/me', 'http://localhost'))
    const meBody = await readJson<{ isAuthenticated: boolean; user: { id: string } | null }>(meResponse)

    expect(meResponse.status).toBe(200)
    expect(meBody.isAuthenticated).toBe(true)
    expect(meBody.user?.id).toBe(signUpBody.user.id)
  })

  it('邮箱注册非法请求体返回 422', async () => {
    const response = await app.handle(
      jsonRequest(
        '/api/auth/sign-up/email',
        {
          email: 'invalid-email',
          password: 'short',
          name: '',
        },
        { method: 'POST' },
      ),
    )

    await expectErrorResponse(response, {
      status: 422,
      errorCode: 'VALIDATION',
    })
  })

  it('邮箱登录失败返回 400', async () => {
    const response = await app.handle(
      jsonRequest(
        '/api/auth/sign-in/email',
        {
          email: 'missing@example.com',
          password: 'wrong-password',
        },
        { method: 'POST' },
      ),
    )

    await expectErrorResponse(response, {
      status: 400,
    })
  })

  it('POST /sign-out 返回 204 且空 body', async () => {
    const suffix = createTestSuffix('auth-sign-out')
    const session = createCookieFetcher(app)
    const signUpResponse = await postJsonWithCookies(
      '/api/auth/sign-up/email',
      {
        email: `${suffix}@example.com`,
        password: 'auth-sign-out-pass-123',
        name: `Auth Sign Out ${suffix}`,
      },
      session.fetcher,
    )
    const signUpBody = await readJson<{ user: { id: string } }>(signUpResponse)
    createdUserIds.push(signUpBody.user.id)

    const signOutResponse = await session.fetcher(new URL('/api/auth/sign-out', 'http://localhost'), {
      method: 'POST',
    })

    await expectNoBody(signOutResponse)
  })
})
