import { afterEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import type { Session } from '@/modules/auth'
import { errorPlugin } from '@/core/plugins'
import { AuthService } from '@/modules/auth'
import { authPlugin } from './auth.plugin'

function createSessionResponse(isAuthenticated: boolean): Session {
  if (!isAuthenticated) {
    return {
      session: null,
      user: null,
      isAuthenticated: false,
    }
  }

  return {
    session: {
      id: 'session-1',
      token: 'token-1',
      userId: 'user-1',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      ipAddress: null,
      userAgent: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    user: {
      id: 'user-1',
      username: 'tester',
      email: 'tester@example.com',
      emailVerified: true,
      displayName: 'Tester',
      avatarUrl: null,
      bio: null,
      status: 'ACTIVE',
      lastLoginAt: null,
      deletedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    isAuthenticated: true,
  } as unknown as Session
}

async function requestJson(app: { handle: (request: Request) => Promise<Response> }, path: string) {
  const response = await app.handle(new Request(`http://localhost${path}`))

  return {
    response,
    body: await response.json(),
  }
}

const originalGetSession = AuthService.getSession

afterEach(() => {
  AuthService.getSession = originalGetSession
})

describe('authPlugin', () => {
  it('should expose getAuth for public routes', async () => {
    AuthService.getSession = async () => createSessionResponse(true)

    const app = new Elysia()
      .use(errorPlugin)
      .use(authPlugin)
      .get('/session', async ({ getAuth, request }) => await getAuth(request))

    const { response, body } = await requestJson(app, '/session')

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      isAuthenticated: true,
      user: {
        id: 'user-1',
      },
      session: {
        id: 'session-1',
      },
    })
  })

  it('should reject unauthenticated access through requireAuth', async () => {
    AuthService.getSession = async () => createSessionResponse(false)

    const app = new Elysia()
      .use(errorPlugin)
      .use(authPlugin)
      .get('/me', async ({ request, requireAuth }) => await requireAuth(request))

    const { response, body } = await requestJson(app, '/me')

    expect(response.status).toBe(401)
    expect(body).toMatchObject({
      code: 401,
      message: '请先登录',
      data: null,
      errorCode: 'UNAUTHORIZED',
    })
  })
})
