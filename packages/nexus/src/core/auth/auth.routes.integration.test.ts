import type { AuthApiService, AuthMethodsService, SessionService } from '@nexus/core'
import type { AuthMutableHeaders } from './cookie.service'
import { createAuthPlugin } from '@nexus/core/access'
import { BadRequestError, HttpError } from '@nexus/core/http'
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { createAuthModule } from '../../modules/auth/routes'

const anonymousSession = {
  user: null,
  session: null,
  isAuthenticated: false,
} as const

const authMethodsService = {
  listPublicMethods: () => [
    {
      id: 'emailPassword',
      kind: 'credential',
      enabled: true,
      allowSignUp: true,
      implemented: true,
      entryPath: '/api/auth/sign-in/email',
    },
    {
      id: 'github',
      kind: 'oauth',
      enabled: true,
      allowSignUp: true,
      implemented: true,
      entryPath: '/api/auth/sign-in/github',
    },
  ],
  getMethodPolicy: () => ({ enabled: true, allowSignUp: true }),
  getMethodMeta: () => ({
    id: 'github',
    kind: 'oauth',
    implemented: true,
    entryPath: '/api/auth/sign-in/github',
  }),
  isMethodEnabled: () => true,
  canMethodSignUp: () => true,
  assertMethodEnabled: () => undefined,
  assertMethodSignUpAllowed: () => undefined,
} as AuthMethodsService

function appendSetCookie(headers: AuthMutableHeaders, value: string) {
  if (headers instanceof Headers) {
    headers.append('Set-Cookie', value)
    return
  }

  headers['Set-Cookie'] = value
}

function createUnexpectedAuthApiService(): AuthApiService {
  const unexpected = async () => {
    throw new Error('不应调用该认证服务方法')
  }

  return {
    callbackGithub: unexpected,
    signInEmail: unexpected,
    signInGithub: unexpected,
    signOut: unexpected,
    signUpEmail: unexpected,
  }
}

function createRouteApp(authApiService: AuthApiService, sessionService: SessionService = {
  async getSession() {
    return anonymousSession
  },
}) {
  return new Elysia()
    .onError(({ error, set }) => {
      if (!(error instanceof HttpError)) {
        throw error
      }

      set.status = error.status
      return {
        code: error.status,
        data: null,
        message: error.message,
        ...(error.code ? { errorCode: error.code } : {}),
      }
    })
    .use(
      createAuthModule({
        authApiService,
        authMethodsService,
        authPlugin: createAuthPlugin(sessionService),
      }),
    )
}

async function readJson<T = unknown>(response: Response): Promise<T> {
  return (await response.json()) as T
}

describe('auth routes with core auth services', () => {
  it('GitHub 登录路由应返回 302 和服务返回的 Location', async () => {
    const service = {
      ...createUnexpectedAuthApiService(),
      async signInGithub() {
        return 'https://github.example/oauth'
      },
    }
    const app = createRouteApp(service)

    const response = await app.handle(
      new Request('http://localhost/auth/sign-in/github?callbackURL=http%3A%2F%2Flocalhost%3A2333%2Fdashboard'),
    )

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://github.example/oauth')
  })

  it('GitHub callback 路由应返回 302 和服务返回的 Location', async () => {
    const service = {
      ...createUnexpectedAuthApiService(),
      async callbackGithub() {
        return 'http://localhost:2333/dashboard'
      },
    }
    const app = createRouteApp(service)

    const response = await app.handle(new Request('http://localhost/auth/callback/github'))

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('http://localhost:2333/dashboard')
  })

  it('邮箱登录服务失败时应返回 400', async () => {
    const service = {
      ...createUnexpectedAuthApiService(),
      async signInEmail() {
        throw new BadRequestError('邮箱或密码错误', 'INVALID_CREDENTIALS')
      },
    }
    const app = createRouteApp(service)

    const response = await app.handle(
      new Request('http://localhost/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'missing@example.com',
          password: 'wrong-password',
        }),
      }),
    )
    const body = await readJson<{ errorCode: string; message: string }>(response)

    expect(response.status).toBe(400)
    expect(body).toMatchObject({
      errorCode: 'INVALID_CREDENTIALS',
      message: '邮箱或密码错误',
    })
  })

  it('邮箱注册服务失败时应返回 400', async () => {
    const service = {
      ...createUnexpectedAuthApiService(),
      async signUpEmail() {
        throw new BadRequestError('邮箱密码注册当前未开启', 'AUTH_SIGN_UP_DISABLED')
      },
    }
    const app = createRouteApp(service)

    const response = await app.handle(
      new Request('http://localhost/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123',
          name: 'Test User',
        }),
      }),
    )
    const body = await readJson<{ errorCode: string; message: string }>(response)

    expect(response.status).toBe(400)
    expect(body).toMatchObject({
      errorCode: 'AUTH_SIGN_UP_DISABLED',
      message: '邮箱密码注册当前未开启',
    })
  })

  it('登出路由应保留清理 cookie 并返回 204 空响应', async () => {
    const service = {
      ...createUnexpectedAuthApiService(),
      async signOut(_request: Request, headers: AuthMutableHeaders) {
        appendSetCookie(headers, 'better-auth.session_token=; Path=/; Max-Age=0')
      },
    }
    const app = createRouteApp(service)

    const response = await app.handle(
      new Request('http://localhost/auth/sign-out', {
        method: 'POST',
      }),
    )

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
    expect(response.headers.get('set-cookie')).toContain('better-auth.session_token=;')
  })
})
