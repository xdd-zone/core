import type { Session as PrismaSession, User } from '@nexus-prisma/generated/client'
import type { SecuritySession, SessionService } from '../auth'
import { HttpError } from '@nexus/core/http'
import { PermissionService } from '@nexus/core/permissions'
import { Elysia } from 'elysia'
import { afterEach, describe, expect, it } from 'bun:test'
import { createAccessPlugin } from './access.plugin'
import { createAuthPlugin } from './auth.plugin'

const originalHasPermission = PermissionService.hasPermission
const originalHasAnyPermission = PermissionService.hasAnyPermission

function createUser(id: string): User {
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
    status: 'ACTIVE',
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
    ipAddress: null,
    userAgent: null,
    createdAt: now,
    updatedAt: now,
  }
}

function createAuthenticatedSession(userId: string): SecuritySession {
  return {
    user: createUser(userId),
    session: createSession(userId),
    isAuthenticated: true,
  }
}

const anonymousSession: SecuritySession = {
  user: null,
  session: null,
  isAuthenticated: false,
}

function createSessionService(sessions: Record<string, SecuritySession>): SessionService {
  return {
    async getSession(headers) {
      const requestHeaders = headers instanceof Headers ? headers : new Headers(headers)
      return sessions[requestHeaders.get('authorization') ?? ''] ?? anonymousSession
    },
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

function requireInjected<T>(value: T | null): T {
  if (!value) {
    throw new Error('缺少插件注入上下文')
  }

  return value
}

async function readJson<T = unknown>(response: Response): Promise<T> {
  return (await response.json()) as T
}

describe('createAuthPlugin', () => {
  afterEach(() => {
    PermissionService.hasPermission = originalHasPermission
    PermissionService.hasAnyPermission = originalHasAnyPermission
  })

  it('可选认证应注入匿名登录态', async () => {
    const app = new Elysia()
      .onError(({ error, set }) => mapHttpError(error, set))
      .use(createAuthPlugin(createSessionService({})))
      .get('/optional', ({ auth, currentUser, currentSession }) => ({
        isAuthenticated: auth.isAuthenticated,
        currentUser,
        currentSession,
      }))

    const response = await app.handle(new Request('http://localhost/optional'))
    const body = await readJson<{
      currentSession: unknown
      currentUser: unknown
      isAuthenticated: boolean
    }>(response)

    expect(response.status).toBe(200)
    expect(body).toEqual({
      isAuthenticated: false,
      currentUser: null,
      currentSession: null,
    })
  })

  it('必需认证应拒绝匿名请求', async () => {
    const app = new Elysia()
      .onError(({ error, set }) => mapHttpError(error, set))
      .use(createAuthPlugin(createSessionService({})))
      .get('/required', ({ currentUser }) => ({ userId: currentUser?.id }), {
        auth: 'required',
      })

    const response = await app.handle(new Request('http://localhost/required'))
    const body = await readJson<{ errorCode: string; message: string }>(response)

    expect(response.status).toBe(401)
    expect(body).toMatchObject({
      errorCode: 'UNAUTHORIZED',
      message: '请先登录',
    })
  })

  it('必需认证应注入当前用户和 session', async () => {
    const app = new Elysia()
      .onError(({ error, set }) => mapHttpError(error, set))
      .use(createAuthPlugin(createSessionService({ Bearer: createAuthenticatedSession('user-1') })))
      .get(
        '/required',
        ({ currentUser, currentSession }) => ({
          userId: requireInjected(currentUser).id,
          sessionId: requireInjected(currentSession).id,
        }),
        {
          auth: 'required',
        },
      )

    const response = await app.handle(
      new Request('http://localhost/required', {
        headers: {
          authorization: 'Bearer',
        },
      }),
    )

    expect(response.status).toBe(200)
    await expect(readJson(response)).resolves.toEqual({
      userId: 'user-1',
      sessionId: 'session-user-1',
    })
  })
})

describe('createAccessPlugin', () => {
  afterEach(() => {
    PermissionService.hasPermission = originalHasPermission
    PermissionService.hasAnyPermission = originalHasAnyPermission
  })

  it('permission.any 应通过 hasAnyPermission 校验任一权限', async () => {
    const calls: Array<[string, string[]]> = []
    PermissionService.hasAnyPermission = async (userId, permissions) => {
      calls.push([userId, [...permissions]])
      return true
    }
    const app = new Elysia()
      .onError(({ error, set }) => mapHttpError(error, set))
      .use(createAccessPlugin(createSessionService({ Bearer: createAuthenticatedSession('user-1') })))
      .get('/category', ({ currentUser }) => ({ userId: requireInjected(currentUser).id }), {
        permission: { any: ['category:read:all', 'category:write:all'] },
      })

    const response = await app.handle(
      new Request('http://localhost/category', {
        headers: {
          authorization: 'Bearer',
        },
      }),
    )

    expect(response.status).toBe(200)
    await expect(readJson(response)).resolves.toEqual({ userId: 'user-1' })
    expect(calls).toEqual([['user-1', ['category:read:all', 'category:write:all']]])
  })

  it('permission.any 不满足时返回 403', async () => {
    PermissionService.hasAnyPermission = async () => false
    const app = new Elysia()
      .onError(({ error, set }) => mapHttpError(error, set))
      .use(createAccessPlugin(createSessionService({ Bearer: createAuthenticatedSession('user-1') })))
      .get('/category', () => ({ ok: true }), {
        permission: { any: ['category:read:all', 'category:write:all'] },
      })

    const response = await app.handle(
      new Request('http://localhost/category', {
        headers: {
          authorization: 'Bearer',
        },
      }),
    )
    const body = await readJson<{ errorCode: string; message: string }>(response)

    expect(response.status).toBe(403)
    expect(body).toMatchObject({
      errorCode: 'FORBIDDEN',
      message: '权限不足',
    })
  })

  it('permission.any 传空数组时应只做登录校验', async () => {
    let anyCalls = 0
    PermissionService.hasAnyPermission = async () => {
      anyCalls += 1
      return false
    }
    const app = new Elysia()
      .onError(({ error, set }) => mapHttpError(error, set))
      .use(createAccessPlugin(createSessionService({ Bearer: createAuthenticatedSession('user-1') })))
      .get('/category', ({ currentUser }) => ({ userId: requireInjected(currentUser).id }), {
        permission: { any: [] },
      })

    const response = await app.handle(
      new Request('http://localhost/category', {
        headers: {
          authorization: 'Bearer',
        },
      }),
    )

    expect(response.status).toBe(200)
    await expect(readJson(response)).resolves.toEqual({ userId: 'user-1' })
    expect(anyCalls).toBe(0)
  })

  it('own 应使用路由参数判断当前用户自己的资源', async () => {
    const calls: Array<[string, string]> = []
    PermissionService.hasPermission = async (userId, permission) => {
      calls.push([userId, permission])
      return permission === 'user:read:own'
    }
    const app = new Elysia()
      .onError(({ error, set }) => mapHttpError(error, set))
      .use(createAccessPlugin(createSessionService({ Bearer: createAuthenticatedSession('user-1') })))
      .get('/users/:id', ({ params }) => ({ id: params.id }), {
        own: 'user:read:own',
      })

    const response = await app.handle(
      new Request('http://localhost/users/user-1', {
        headers: {
          authorization: 'Bearer',
        },
      }),
    )

    expect(response.status).toBe(200)
    await expect(readJson(response)).resolves.toEqual({ id: 'user-1' })
    expect(calls).toEqual([
      ['user-1', 'user:read:all'],
      ['user-1', 'user:read:own'],
    ])
  })

  it('own 缺少路由参数时应返回 403', async () => {
    PermissionService.hasPermission = async () => false
    const app = new Elysia()
      .onError(({ error, set }) => mapHttpError(error, set))
      .use(createAccessPlugin(createSessionService({ Bearer: createAuthenticatedSession('user-1') })))
      .get('/users', () => ({ ok: true }), {
        own: 'user:read:own',
      })

    const response = await app.handle(
      new Request('http://localhost/users', {
        headers: {
          authorization: 'Bearer',
        },
      }),
    )

    expect(response.status).toBe(403)
    await expect(readJson(response)).resolves.toMatchObject({
      errorCode: 'FORBIDDEN',
      message: '权限不足',
    })
  })

  it('own 命中他人资源且没有 all 权限时应返回 403', async () => {
    const calls: Array<[string, string]> = []
    PermissionService.hasPermission = async (userId, permission) => {
      calls.push([userId, permission])
      return false
    }
    const app = new Elysia()
      .onError(({ error, set }) => mapHttpError(error, set))
      .use(createAccessPlugin(createSessionService({ Bearer: createAuthenticatedSession('user-1') })))
      .get('/users/:id', () => ({ ok: true }), {
        own: 'user:read:own',
      })

    const response = await app.handle(
      new Request('http://localhost/users/user-2', {
        headers: {
          authorization: 'Bearer',
        },
      }),
    )

    expect(response.status).toBe(403)
    await expect(readJson(response)).resolves.toMatchObject({
      errorCode: 'FORBIDDEN',
      message: '权限不足',
    })
    expect(calls).toEqual([['user-1', 'user:read:all']])
  })

  it('me 应校验当前用户自己的权限', async () => {
    const calls: Array<[string, string]> = []
    PermissionService.hasPermission = async (userId, permission) => {
      calls.push([userId, permission])
      return true
    }
    const app = new Elysia()
      .onError(({ error, set }) => mapHttpError(error, set))
      .use(createAccessPlugin(createSessionService({ Bearer: createAuthenticatedSession('user-1') })))
      .get('/me', ({ currentUser }) => ({ userId: requireInjected(currentUser).id }), {
        me: 'user_permission:read:own',
      })

    const response = await app.handle(
      new Request('http://localhost/me', {
        headers: {
          authorization: 'Bearer',
        },
      }),
    )

    expect(response.status).toBe(200)
    await expect(readJson(response)).resolves.toEqual({ userId: 'user-1' })
    expect(calls).toEqual([['user-1', 'user_permission:read:own']])
  })

  it('permission 路由同一次请求不应重复读取 session', async () => {
    let sessionCalls = 0
    PermissionService.hasPermission = async () => true
    const sessionService: SessionService = {
      async getSession() {
        sessionCalls += 1
        return createAuthenticatedSession('user-1')
      },
    }
    const app = new Elysia()
      .onError(({ error, set }) => mapHttpError(error, set))
      .use(createAccessPlugin(sessionService))
      .get('/protected', ({ currentUser }) => ({ userId: requireInjected(currentUser).id }), {
        permission: 'user:read:all',
      })

    const response = await app.handle(
      new Request('http://localhost/protected', {
        headers: {
          authorization: 'Bearer',
        },
      }),
    )

    expect(response.status).toBe(200)
    await expect(readJson(response)).resolves.toEqual({ userId: 'user-1' })
    expect(sessionCalls).toBe(1)
  })
})
