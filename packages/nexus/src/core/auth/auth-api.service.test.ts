import type { AuthMethodsService } from './auth-methods.service'
import type { BetterAuthInstance } from './better-auth'
import type { SessionService } from './session.service'

import { prisma } from '@nexus/infra/database/client'
import { afterAll, describe, expect, it } from 'bun:test'
import { createAuthApiService } from './auth-api.service'
import { createBetterAuthAdapter } from './better-auth.adapter'

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

const anonymousSessionService = {
  getSession: async () => ({
    session: null,
    user: null,
    isAuthenticated: false,
  }),
} satisfies SessionService

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

function createService(sessionToken: string, redirectURL: string) {
  const betterAuthInstance = {
    options: {
      secret: 'auth-api-service-test-secret-value-32',
      url: 'http://localhost:7788',
    },
    handler: async () =>
      new Response(null, {
        headers: {
          location: redirectURL,
          'set-cookie': `better-auth.session_token=${sessionToken}.signature; Path=/; HttpOnly; SameSite=Lax`,
        },
        status: 302,
      }),
  } as unknown as BetterAuthInstance

  const betterAuthAdapter = createBetterAuthAdapter(betterAuthInstance, anonymousSessionService)

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
    authMethodsService,
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
