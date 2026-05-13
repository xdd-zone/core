import { afterEach, beforeAll, describe, expect, it } from 'bun:test'
import {
  createCookieFetcher,
  createIntegrationTestContext,
  createTestRequest,
  createTestSuffix,
  expectErrorResponse,
  expectNoBody,
  readJson,
  seedBasePermissions,
} from '../../test'
import { prisma } from '../../infra/database'

const integration = createIntegrationTestContext({
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
const { app, context } = integration

const emailPasswordDisabledIntegration = createIntegrationTestContext({
  config: {
    auth: {
      methods: {
        emailPassword: {
          enabled: false,
          allowSignUp: false,
        },
      },
    },
  },
})

const emailPasswordSignUpDisabledIntegration = createIntegrationTestContext({
  config: {
    auth: {
      methods: {
        emailPassword: {
          enabled: true,
          allowSignUp: false,
        },
      },
    },
  },
})

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

interface AuthMethodBody {
  methods: Array<{
    allowSignUp: boolean
    enabled: boolean
    entryPath: string | null
    id: string
    implemented: boolean
    kind: string
  }>
}

interface AuthSessionBody {
  isAuthenticated?: boolean
  session?: {
    createdAt: string
    expiresAt: string
    id: string
    ipAddress: string | null
    token: string
    userAgent: string | null
    userId: string
  } | null
  token?: string
  user: {
    createdAt: string
    deletedAt?: string | null
    email: string | null
    emailVerified?: boolean | null
    emailVerifiedAt?: string | null
    id: string
    image?: string | null
    introduce?: string | null
    lastLogin?: string | null
    lastLoginIp?: string | null
    name: string
    phone?: string | null
    phoneVerified?: boolean | null
    phoneVerifiedAt?: string | null
    status?: string | null
    updatedAt: string
    username?: string | null
  } | null
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

function createCookieSession() {
  const session = createCookieFetcher(app)

  return {
    session,
    fetchJson: async (path: string, body: unknown, method = 'POST') =>
      await session.fetcher(new URL(path, 'http://localhost'), {
        body: JSON.stringify(body),
        headers: {
          'content-type': 'application/json',
        },
        method,
      }),
  }
}

function expectSessionContract(
  body: AuthSessionBody,
  expected: {
    email: string
    name: string
  },
) {
  expect(body.user).toMatchObject({
    email: expected.email,
    name: expected.name,
  })
  expect(typeof body.user?.id).toBe('string')
  expect(typeof body.user?.createdAt).toBe('string')
  expect(typeof body.user?.updatedAt).toBe('string')
}

function expectAuthenticatedSession(
  body: AuthSessionBody,
  expected: {
    email: string
    name: string
    userId?: string
  },
) {
  expect(body.isAuthenticated).toBe(true)
  expectSessionContract(body, expected)
  expect(body.session).toEqual(
    expect.objectContaining({
      userId: expected.userId ?? body.user?.id,
    }),
  )
  expect(typeof body.session?.id).toBe('string')
  expect(typeof body.session?.expiresAt).toBe('string')
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
  await seedBasePermissions()
})

afterEach(async () => {
  await integration.cleanup()
  await emailPasswordDisabledIntegration.cleanup()
  await emailPasswordSignUpDisabledIntegration.cleanup()
})

describe('auth routes', () => {
  describe('OpenAPI', () => {
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
      expect(jsonSchema(signUpEmail)?.properties).toEqual(expect.objectContaining({ session: expect.any(Object), user: expect.any(Object) }))
      expect(jsonSchema(signInEmail)?.properties).toEqual(expect.objectContaining({ session: expect.any(Object), user: expect.any(Object) }))
      expect(signOut?.responses).toHaveProperty('204')
      expect(jsonSchema(getSession)?.required).toEqual(expect.arrayContaining(['user', 'session', 'isAuthenticated']))
      expect(jsonSchema(me)?.required).toEqual(expect.arrayContaining(['user', 'session', 'isAuthenticated']))
    })
  })

  describe('methods', () => {
    it('GET /methods 返回当前登录方式', async () => {
      const response = await app.handle(jsonRequest('/api/auth/methods'))
      const body = await readJson<AuthMethodBody>(response)

      expect(response.status).toBe(200)
      expect(body.methods).toContainEqual(
        expect.objectContaining({
          id: 'emailPassword',
          enabled: true,
          allowSignUp: true,
          implemented: true,
          kind: 'credential',
        }),
      )
      expect(body.methods).toContainEqual(
        expect.objectContaining({
          id: 'github',
          enabled: context.config.auth.methods.github.enabled,
          allowSignUp: context.config.auth.methods.github.allowSignUp,
          implemented: true,
          kind: 'oauth',
        }),
      )
    })
  })

  describe('OAuth redirect', () => {
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

    it('GET /sign-in/github callbackURL 非法时返回 302 登录页错误参数', async () => {
      const response = await app.handle(
        createTestRequest(
          '/api/auth/sign-in/github?callbackURL=https%3A%2F%2Fevil.example.com%2Fdashboard',
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
      const location = response.headers.get('location')
      expect(location).toBeTruthy()
      expect(location).toContain('/login')
      expect(location).toContain('error=invalid_callback_url')
      expect(location).toContain('method=github')
    })
  })

  describe('sign-up', () => {
    it('邮箱注册成功返回完整会话并写入登录态', async () => {
      const suffix = createTestSuffix('auth-route-sign-up')
      const password = 'auth-route-pass-123'
      const { session, fetchJson } = createCookieSession()
      const email = `${suffix}@example.com`
      const name = `Auth Route ${suffix}`

      const signUpResponse = await fetchJson('/api/auth/sign-up/email', {
        email,
        password,
        name,
      })
      const signUpBody = await readJson<AuthSessionBody>(signUpResponse)
      integration.track.userId(signUpBody.user?.id ?? '')

      expect(signUpResponse.status).toBe(200)
      expectSessionContract(signUpBody, { email, name })

      const meResponse = await session.fetcher(new URL('/api/auth/me', 'http://localhost'))
      const meBody = await readJson<AuthSessionBody>(meResponse)

      expect(meResponse.status).toBe(200)
      expectAuthenticatedSession(meBody, {
        email,
        name,
        userId: signUpBody.user?.id,
      })
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

    it('邮箱注册在方法关闭时返回 400', async () => {
      const response = await emailPasswordDisabledIntegration.app.handle(
        jsonRequest(
          '/api/auth/sign-up/email',
          {
            email: `${createTestSuffix('auth-disabled')}@example.com`,
            password: 'disabled-pass-123',
            name: 'Disabled Auth',
          },
          { method: 'POST' },
        ),
      )

      await expectErrorResponse(response, {
        status: 400,
        message: '邮箱密码登录当前未开启',
        errorCode: 'AUTH_METHOD_DISABLED',
      })
    })

    it('邮箱注册在禁止注册时返回 400', async () => {
      const response = await emailPasswordSignUpDisabledIntegration.app.handle(
        jsonRequest(
          '/api/auth/sign-up/email',
          {
            email: `${createTestSuffix('auth-signup-disabled')}@example.com`,
            password: 'disabled-pass-123',
            name: 'Disabled Sign Up',
          },
          { method: 'POST' },
        ),
      )

      await expectErrorResponse(response, {
        status: 400,
        message: '邮箱密码注册当前未开启',
        errorCode: 'AUTH_SIGN_UP_DISABLED',
      })
    })
  })

  describe('sign-in', () => {
    it('邮箱登录成功返回完整会话并写入登录态', async () => {
      const suffix = createTestSuffix('auth-route-sign-in')
      const password = 'auth-route-pass-123'
      const email = `${suffix}@example.com`
      const name = `Auth Route ${suffix}`

      const signUpSession = createCookieSession()
      const signUpResponse = await signUpSession.fetchJson('/api/auth/sign-up/email', {
        email,
        password,
        name,
      })
      const signUpBody = await readJson<AuthSessionBody>(signUpResponse)
      integration.track.userId(signUpBody.user?.id ?? '')

      const signInSession = createCookieSession()
      const signInResponse = await signInSession.fetchJson('/api/auth/sign-in/email', {
        email,
        password,
      })
      const signInBody = await readJson<AuthSessionBody>(signInResponse)

      expect(signInResponse.status).toBe(200)
      expectSessionContract(signInBody, { email, name })
      expect(signInBody.user?.id).toBe(signUpBody.user?.id)

      const meResponse = await signInSession.session.fetcher(new URL('/api/auth/me', 'http://localhost'))
      const meBody = await readJson<AuthSessionBody>(meResponse)

      expect(meResponse.status).toBe(200)
      expectAuthenticatedSession(meBody, {
        email,
        name,
        userId: signUpBody.user?.id,
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

    it('邮箱登录在方法关闭时返回 400', async () => {
      const response = await emailPasswordDisabledIntegration.app.handle(
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
        message: '邮箱密码登录当前未开启',
        errorCode: 'AUTH_METHOD_DISABLED',
      })
    })

    it('邮箱登录停用账号时返回 401 并删除 session', async () => {
      const suffix = createTestSuffix('auth-route-inactive-sign-in')
      const password = 'inactive-pass-123'
      const signUpResponse = await app.handle(
        jsonRequest(
          '/api/auth/sign-up/email',
          {
            email: `${suffix}@example.com`,
            password,
            name: `Inactive Auth ${suffix}`,
          },
          { method: 'POST' },
        ),
      )
      const signUpBody = await readJson<AuthSessionBody>(signUpResponse)
      integration.track.userId(signUpBody.user?.id ?? '')

      expect(signUpResponse.status).toBe(200)
      const userId = signUpBody.user?.id ?? ''
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          status: 'INACTIVE',
        },
      })

      const response = await app.handle(
        jsonRequest(
          '/api/auth/sign-in/email',
          {
            email: `${suffix}@example.com`,
            password,
          },
          { method: 'POST' },
        ),
      )

      await expectErrorResponse(response, {
        status: 401,
        message: '账号已被停用',
        errorCode: 'UNAUTHORIZED',
      })

      const sessionCount = await prisma.session.count({
        where: {
          userId,
        },
      })
      expect(sessionCount).toBe(0)
      expect(response.headers.get('set-cookie')).toContain('better-auth.session_token=;')
    })
  })

  describe('sign-out', () => {
    it('POST /sign-out 返回 204 且空 body', async () => {
      const suffix = createTestSuffix('auth-sign-out')
      const { session, fetchJson } = createCookieSession()
      const signUpResponse = await fetchJson('/api/auth/sign-up/email', {
        email: `${suffix}@example.com`,
        password: 'auth-sign-out-pass-123',
        name: `Auth Sign Out ${suffix}`,
      })
      const signUpBody = await readJson<AuthSessionBody>(signUpResponse)
      integration.track.userId(signUpBody.user?.id ?? '')

      const signOutResponse = await session.fetcher(new URL('/api/auth/sign-out', 'http://localhost'), {
        method: 'POST',
      })

      await expectNoBody(signOutResponse)

      const getSessionResponse = await session.fetcher(new URL('/api/auth/get-session', 'http://localhost'))
      const getSessionBody = await readJson<AuthSessionBody>(getSessionResponse)

      expect(getSessionResponse.status).toBe(200)
      expect(getSessionBody).toEqual({
        user: null,
        session: null,
        isAuthenticated: false,
      })
    })
  })

  describe('session endpoints', () => {
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
  })
})
