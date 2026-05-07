import type { AuthMethodsService } from './auth-methods.service'
import type { BetterAuthInstance } from './better-auth'

import { prisma } from '@nexus/infra/database/client'
import { afterAll, describe, expect, it } from 'bun:test'
import { createAccountStatusService } from './account-status.service'
import { createAuthApiService } from './auth-api.service'
import { createOAuthRedirectService } from './oauth-redirect.service'
import type { BetterAuthAdapter } from './better-auth.adapter'
import { createBetterAuthAdapter } from './better-auth.adapter'
import { createBetterAuthCookieService } from './cookie.service'
import { createSessionService } from './session.service'

const tempSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const createdUserIds: string[] = []

const authMethodsService = {
  listPublicMethods: () => [],
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

function getSetCookieValues(headers: Headers): string[] {
  const headersWithGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[]
  }

  if (typeof headersWithGetSetCookie.getSetCookie === 'function') {
    return headersWithGetSetCookie.getSetCookie()
  }

  const cookie = headers.get('set-cookie')
  return cookie ? [cookie] : []
}

async function createUserSession(status: 'ACTIVE' | 'INACTIVE' | 'BANNED', deletedAt: Date | null = null) {
  const token = `auth-callback-token-${status.toLowerCase()}-${tempSuffix}-${Math.random().toString(36).slice(2, 8)}`
  const user = await prisma.user.create({
    data: {
      email: `auth-callback-${status.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}-${tempSuffix}@example.com`,
      emailVerified: true,
      name: `Auth Callback ${status}`,
      status,
      deletedAt,
      sessions: {
        create: {
          id: `auth-callback-session-${Math.random().toString(36).slice(2, 8)}-${tempSuffix}`,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      },
    },
    select: {
      id: true,
    },
  })

  createdUserIds.push(user.id)

  return {
    token,
    userId: user.id,
  }
}

function createService(
  sessionToken: string,
  redirectURL: string,
  options?: {
    authMethodsService?: AuthMethodsService
    onBetterAuthRequest?: (request: Request) => void | Promise<void>
  },
) {
  const betterAuthInstance = {
    options: {
      secret: 'auth-api-service-test-secret-value-32',
      url: 'http://localhost:7788',
    },
    handler: async (request: Request) => {
      await options?.onBetterAuthRequest?.(request)
      return new Response(null, {
        headers: {
          location: redirectURL,
          'set-cookie': `better-auth.session_token=${sessionToken}.signature; Path=/; HttpOnly; SameSite=Lax`,
        },
        status: 302,
      })
    },
  } as unknown as BetterAuthInstance

  const betterAuthAdapter = createBetterAuthAdapter(betterAuthInstance)

  return createAuthApiService(
    {
      auth: {
        trustedOrigins: ['http://localhost:2333'],
        methods: {
          emailPassword: {
            enabled: true,
            allowSignUp: true,
          },
          github: {
            enabled: true,
            allowSignUp: true,
          },
          google: {
            enabled: false,
            allowSignUp: false,
          },
          wechat: {
            enabled: false,
            allowSignUp: false,
          },
        },
      },
      betterAuth: {
        secret: 'auth-api-service-test-secret-value-32',
        url: 'http://localhost:7788',
        providers: {},
      },
    },
    options?.authMethodsService ?? authMethodsService,
    betterAuthAdapter,
  )
}

afterAll(async () => {
  if (createdUserIds.length === 0) {
    return
  }

  await prisma.user.deleteMany({
    where: {
      id: {
        in: createdUserIds,
      },
    },
  })
})

describe('AuthApiService.signInGithub', () => {
  it('可信 callbackURL 应进入 BetterAuth social 请求', async () => {
    const headers = new Headers()
    let socialPayload: Record<string, unknown> | null = null
    const service = createService('', 'https://github.example/oauth', {
      onBetterAuthRequest: async (request) => {
        socialPayload = (await request.json()) as Record<string, unknown>
      },
    })

    const redirectURL = await service.signInGithub(
      new Request(
        'http://localhost:7788/api/auth/sign-in/github?callbackURL=http%3A%2F%2Flocalhost%3A2333%2Fdashboard%3Ffrom%3Dgithub',
        {
          headers: {
            referer: 'http://localhost:2333/login?redirect=%2Fdashboard',
          },
        },
      ),
      headers,
    )

    expect(redirectURL).toBe('https://github.example/oauth')
    expect(socialPayload).not.toBeNull()
    const payload = socialPayload as unknown as Record<string, unknown>
    expect(payload.provider).toBe('github')
    expect(payload.callbackURL).toBe('http://localhost:2333/dashboard?from=github')
    expect(payload.newUserCallbackURL).toBe('http://localhost:2333/dashboard?from=github')
    expect(payload.errorCallbackURL).toBe('http://localhost:2333/login?redirect=%2Fdashboard%3Ffrom%3Dgithub')
    expect(payload.requestSignUp).toBe(true)
  })

  it('外部 callbackURL 应回跳可信登录页并带 invalid_callback_url', async () => {
    const headers = new Headers()
    const service = createService('', 'https://github.example/oauth')

    const redirectURL = await service.signInGithub(
      new Request('http://localhost:7788/api/auth/sign-in/github?callbackURL=https%3A%2F%2Fevil.example%2Fdashboard', {
        headers: {
          referer: 'http://localhost:2333/login?redirect=%2Fdashboard',
        },
      }),
      headers,
    )

    const redirect = new URL(redirectURL)
    expect(`${redirect.origin}${redirect.pathname}`).toBe('http://localhost:2333/login')
    expect(redirect.searchParams.get('redirect')).toBe('/dashboard')
    expect(redirect.searchParams.get('error')).toBe('invalid_callback_url')
    expect(redirect.searchParams.get('method')).toBe('github')
  })

  it('GitHub 方法禁用时应回跳登录页并带 auth_method_disabled', async () => {
    const headers = new Headers()
    const disabledAuthMethodsService = {
      ...authMethodsService,
      assertMethodEnabled: () => {
        const error = new Error('Auth method disabled') as Error & { code: string }
        error.code = 'AUTH_METHOD_DISABLED'
        throw error
      },
    } as AuthMethodsService
    const service = createService('', 'https://github.example/oauth', {
      authMethodsService: disabledAuthMethodsService,
    })

    const redirectURL = await service.signInGithub(
      new Request(
        'http://localhost:7788/api/auth/sign-in/github?callbackURL=http%3A%2F%2Flocalhost%3A2333%2Fdashboard',
        {
          headers: {
            referer: 'http://localhost:2333/login?redirect=%2Fdashboard',
          },
        },
      ),
      headers,
    )

    const redirect = new URL(redirectURL)
    expect(`${redirect.origin}${redirect.pathname}`).toBe('http://localhost:2333/login')
    expect(redirect.searchParams.get('redirect')).toBe('/dashboard')
    expect(redirect.searchParams.get('error')).toBe('auth_method_disabled')
    expect(redirect.searchParams.get('method')).toBe('github')
  })

  it('OAuthRedirectService 应解析可信重定向来源', () => {
    const redirectService = createOAuthRedirectService({
      configuredAuthOrigin: 'http://localhost:7788',
      trustedOrigins: ['http://localhost:2333'],
    })

    expect(
      redirectService.resolveTrustedRedirectOrigin(
        new Request('http://localhost:7788/api/auth/callback/github'),
        'http://localhost:2333/dashboard',
      ),
    ).toBe('http://localhost:2333')
  })

  it('OAuthRedirectService 无可信浏览器来源时应回退到第一个可信前端来源', () => {
    const redirectService = createOAuthRedirectService({
      configuredAuthOrigin: 'http://localhost:7788',
      trustedOrigins: ['http://localhost:2333', 'http://localhost:7788'],
    })

    const frontendOrigin = redirectService.resolveFrontendOrigin(
      new Request('http://localhost:7788/api/auth/sign-in/github'),
      null,
    )

    expect(frontendOrigin).toBe('http://localhost:2333')
    expect(redirectService.resolveCallbackUrl(frontendOrigin, null)).toBe('http://localhost:2333/dashboard')
  })

  it('OAuthRedirectService 不应默认允许未写入 trustedOrigins 的 Better Auth 来源作为 callbackURL', () => {
    const redirectService = createOAuthRedirectService({
      configuredAuthOrigin: 'http://localhost:7788',
      trustedOrigins: ['http://localhost:2333'],
    })

    expect(() =>
      redirectService.resolveCallbackUrl('http://localhost:2333', 'http://localhost:7788/dashboard'),
    ).toThrow('Invalid callbackURL')
  })
})

describe('AuthApiService.callbackGithub', () => {
  it('GitHub callback 返回停用账号会话时应删除 session 并回跳登录页', async () => {
    const { token, userId } = await createUserSession('BANNED')
    const headers = new Headers()
    const service = createService(token, 'http://localhost:2333/dashboard?from=github')

    const redirectURL = await service.callbackGithub(
      new Request('http://localhost:7788/api/auth/callback/github'),
      headers,
    )

    const redirect = new URL(redirectURL)
    expect(`${redirect.origin}${redirect.pathname}`).toBe('http://localhost:2333/login')
    expect(redirect.searchParams.get('redirect')).toBe('/dashboard?from=github')
    expect(redirect.searchParams.get('error')).toBe('inactive_account')
    expect(redirect.searchParams.get('method')).toBe('github')

    const sessionCount = await prisma.session.count({
      where: {
        userId,
      },
    })
    expect(sessionCount).toBe(0)
    expect(getSetCookieValues(headers).some((cookie) => cookie.startsWith('better-auth.session_token=;'))).toBe(true)
  })

  it('GitHub callback 返回已删除账号会话时应删除 session 并回跳登录页', async () => {
    const { token, userId } = await createUserSession('ACTIVE', new Date())
    const headers = new Headers()
    const service = createService(token, 'http://localhost:2333/dashboard')

    const redirectURL = await service.callbackGithub(
      new Request('http://localhost:7788/api/auth/callback/github'),
      headers,
    )

    const redirect = new URL(redirectURL)
    expect(`${redirect.origin}${redirect.pathname}`).toBe('http://localhost:2333/login')
    expect(redirect.searchParams.get('redirect')).toBe('/dashboard')
    expect(redirect.searchParams.get('error')).toBe('inactive_account')

    const sessionCount = await prisma.session.count({
      where: {
        userId,
      },
    })
    expect(sessionCount).toBe(0)
  })

  it('GitHub callback 返回正常账号会话时应保留原回跳地址', async () => {
    const { token, userId } = await createUserSession('ACTIVE')
    const headers = new Headers()
    const service = createService(token, 'http://localhost:2333/dashboard')

    const redirectURL = await service.callbackGithub(
      new Request('http://localhost:7788/api/auth/callback/github'),
      headers,
    )

    expect(redirectURL).toBe('http://localhost:2333/dashboard')

    const sessionCount = await prisma.session.count({
      where: {
        userId,
      },
    })
    expect(sessionCount).toBe(1)
  })
})

describe('AccountStatusService', () => {
  it('停用用户应删除该用户所有 session 并清除 Better Auth cookie', async () => {
    const { userId } = await createUserSession('INACTIVE')
    const headers = new Headers()
    let clearCookiesCalled = false
    const service = createAccountStatusService({
      clearBetterAuthCookies: (targetHeaders) => {
        clearCookiesCalled = true
        if (targetHeaders instanceof Headers) {
          targetHeaders.append('set-cookie', 'better-auth.session_token=; Path=/; Max-Age=0')
        }
      },
    } as BetterAuthAdapter)

    await expect(service.assertActiveSignedInUser(userId, headers)).rejects.toThrow('账号已被停用')

    const sessionCount = await prisma.session.count({
      where: {
        userId,
      },
    })
    expect(sessionCount).toBe(0)
    expect(clearCookiesCalled).toBe(true)
    expect(getSetCookieValues(headers).some((cookie) => cookie.startsWith('better-auth.session_token=;'))).toBe(true)
  })
})

describe('BetterAuthAdapter.signOut', () => {
  it('停用账号登出时应直接通过 session token 删除服务端 session', async () => {
    const { token, userId } = await createUserSession('INACTIVE')
    const betterAuthInstance = {
      options: {
        secret: 'auth-api-service-test-secret-value-32',
        url: 'http://localhost:7788',
      },
      handler: async () => new Response('{}'),
    } as unknown as BetterAuthInstance
    const adapter = createBetterAuthAdapter(betterAuthInstance)

    await adapter.revokeBetterAuthSession(
      new Request('http://localhost:7788/api/auth/sign-out', {
        headers: {
          cookie: `better-auth.session_token=${token}.signature`,
        },
      }),
    )

    const sessionCount = await prisma.session.count({
      where: {
        userId,
      },
    })
    expect(sessionCount).toBe(0)
  })
})

describe('SessionService', () => {
  it('Better Auth 找不到有效 session 时应返回未登录', async () => {
    const service = createSessionService({
      api: {
        getSession: async () => null,
      },
    } as unknown as BetterAuthInstance)

    await expect(
      service.getSession(
        new Headers({
          cookie: 'better-auth.session_token=missing-token.signature',
        }),
      ),
    ).resolves.toEqual({
      session: null,
      user: null,
      isAuthenticated: false,
    })
  })

  it('Better Auth getSession 抛错时应继续抛出', async () => {
    const error = new Error('better auth getSession failed')
    const service = createSessionService({
      api: {
        getSession: async () => {
          throw error
        },
      },
    } as unknown as BetterAuthInstance)

    await expect(service.getSession(new Headers())).rejects.toThrow(error)
  })
})

describe('BetterAuthCookieService', () => {
  it('应从 request cookie 中解析 session token', () => {
    const cookieService = createBetterAuthCookieService({
      secret: 'auth-api-service-test-secret-value-32',
    })

    const token = cookieService.resolveSessionToken(
      new Request('http://localhost:7788/api/auth/sign-out', {
        headers: {
          cookie: 'other=value; better-auth.session_token=request-token.signature; theme=dark',
        },
      }),
    )

    expect(token).toBe('request-token')
  })

  it('应优先从响应 Set-Cookie 中解析 session token', () => {
    const headers = new Headers()
    headers.append('Set-Cookie', 'better-auth.session_token=response-token.signature; Path=/; HttpOnly')
    const cookieService = createBetterAuthCookieService({
      secret: 'auth-api-service-test-secret-value-32',
    })

    const token = cookieService.resolveSessionToken(
      new Request('http://localhost:7788/api/auth/callback/github', {
        headers: {
          cookie: 'better-auth.session_token=request-token.signature',
        },
      }),
      headers,
    )

    expect(token).toBe('response-token')
  })

  it('应把 Better Auth 响应里的 Set-Cookie 复制到可变 headers', () => {
    const responseHeaders = new Headers()
    responseHeaders.append('Set-Cookie', 'better-auth.session_token=token.signature; Path=/; HttpOnly')
    responseHeaders.append('Set-Cookie', 'better-auth.session_data=data; Path=/; HttpOnly')
    const headers = new Headers()
    const cookieService = createBetterAuthCookieService({
      secret: 'auth-api-service-test-secret-value-32',
    })

    cookieService.copySetCookies(responseHeaders, headers)

    const cookies = getSetCookieValues(headers)
    expect(cookies).toContain('better-auth.session_token=token.signature; Path=/; HttpOnly')
    expect(cookies).toContain('better-auth.session_data=data; Path=/; HttpOnly')
  })

  it('清除 cookie 时应保留 Better Auth 配置里的属性并清理 account_data', () => {
    const headers = new Headers()
    const cookieService = createBetterAuthCookieService({
      secret: 'auth-api-service-test-secret-value-32',
      advanced: {
        defaultCookieAttributes: {
          domain: '.example.com',
          path: '/auth',
          sameSite: 'none',
          secure: true,
        },
      },
    })

    cookieService.clearBetterAuthCookies(headers)

    const cookies = getSetCookieValues(headers)
    const sessionTokenCookie = cookies.find((cookie) => cookie.startsWith('better-auth.session_token=;'))
    expect(sessionTokenCookie).toContain('Domain=.example.com')
    expect(sessionTokenCookie).toContain('Path=/auth')
    expect(sessionTokenCookie).toContain('SameSite=None')
    expect(sessionTokenCookie).toContain('Secure')
    expect(cookies.some((cookie) => cookie.startsWith('better-auth.account_data=;'))).toBe(true)
  })

  it('应生成清除 Better Auth 会话相关 cookie 的 Set-Cookie', () => {
    const headers = new Headers()
    const cookieService = createBetterAuthCookieService({
      secret: 'auth-api-service-test-secret-value-32',
    })

    cookieService.clearBetterAuthCookies(headers)

    const cookies = getSetCookieValues(headers)
    expect(cookies.some((cookie) => cookie.startsWith('better-auth.session_token=;'))).toBe(true)
    expect(cookies.some((cookie) => cookie.startsWith('better-auth.session_data=;'))).toBe(true)
    expect(cookies.some((cookie) => cookie.startsWith('better-auth.dont_remember=;'))).toBe(true)
  })
})
