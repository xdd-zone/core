import type { Session as PrismaSession, User } from '@nexus-prisma/generated/client'
import type { SecuritySession, SessionService } from '../auth'
import { HttpError } from '@nexus/core/http'
import { Elysia } from 'elysia'
import { describe, expect, it } from 'bun:test'
import { createAuthPlugin } from './auth.plugin'

function createUser(id: string, status: User['status'] = 'ACTIVE'): User {
  const now = new Date()

  return {
    id,
    email: `${id}@example.com`,
    emailVerified: true,
    emailVerifiedAt: null,
    username: null,
    name: id,
    image: null,
    introduce: null,
    phone: null,
    phoneVerified: null,
    phoneVerifiedAt: null,
    lastLogin: null,
    lastLoginIp: null,
    status,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
}

function createSession(userId: string): PrismaSession {
  const now = new Date()

  return {
    id: `session-${userId}`,
    userId,
    token: `token-${userId}`,
    expiresAt: new Date(Date.now() + 60_000),
    ipAddress: '127.0.0.1',
    userAgent: 'bun-test',
    createdAt: now,
    updatedAt: now,
  }
}

function mapHttpError(error: unknown, set: { status?: number | string }) {
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
}

async function readJson<T = unknown>(response: Response): Promise<T> {
  return (await response.json()) as T
}

describe('createAuthPlugin', () => {
  it('已声明登录但缺少 session 时应返回 401', async () => {
    const sessionService: SessionService = {
      async getSession() {
        return {
          user: createUser('user-1'),
          session: null,
          isAuthenticated: true,
        }
      },
    }
    const app = new Elysia()
      .onError(({ error, set }) => mapHttpError(error, set))
      .use(createAuthPlugin(sessionService))
      .get('/required', () => ({ ok: true }), {
        auth: 'required',
      })

    const response = await app.handle(new Request('http://localhost/required'))

    await expect(readJson(response)).resolves.toMatchObject({
      errorCode: 'UNAUTHORIZED',
      message: '请先登录',
    })
    expect(response.status).toBe(401)
  })

  it('已声明登录但缺少 user 时应返回 401', async () => {
    const sessionService: SessionService = {
      async getSession() {
        return {
          user: null,
          session: createSession('user-1'),
          isAuthenticated: true,
        }
      },
    }
    const app = new Elysia()
      .onError(({ error, set }) => mapHttpError(error, set))
      .use(createAuthPlugin(sessionService))
      .get('/required', () => ({ ok: true }), {
        auth: 'required',
      })

    const response = await app.handle(new Request('http://localhost/required'))

    await expect(readJson(response)).resolves.toMatchObject({
      errorCode: 'UNAUTHORIZED',
      message: '请先登录',
    })
    expect(response.status).toBe(401)
  })

  it('同一次必需认证请求不应重复读取 session', async () => {
    let calls = 0
    const sessionService: SessionService = {
      async getSession() {
        calls += 1
        return {
          user: createUser('user-1'),
          session: createSession('user-1'),
          isAuthenticated: true,
        } satisfies SecuritySession
      },
    }
    const app = new Elysia()
      .onError(({ error, set }) => mapHttpError(error, set))
      .use(createAuthPlugin(sessionService))
      .get(
        '/required',
        ({ auth, currentSession, currentUser }) => ({
          isAuthenticated: auth.isAuthenticated,
          sessionId: currentSession?.id,
          userId: currentUser?.id,
        }),
        {
          auth: 'required',
        },
      )

    const response = await app.handle(new Request('http://localhost/required'))

    expect(response.status).toBe(200)
    await expect(readJson(response)).resolves.toEqual({
      isAuthenticated: true,
      sessionId: 'session-user-1',
      userId: 'user-1',
    })
    expect(calls).toBe(1)
  })
})
