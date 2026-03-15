import { afterEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import type { Session } from '@/modules/auth'
import { errorPlugin } from '@/core/plugins'
import { PermissionService } from '@/core/permissions/permission.service'
import { AuthService } from '@/modules/auth'
import { Permissions } from './permission.plugin'
import { permit, permissionPlugin } from './permission.plugin'

function createSessionResponse(userId: string | null): Session {
  if (!userId) {
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
      userId,
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      ipAddress: null,
      userAgent: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    user: {
      id: userId,
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
const originalHasPermission = PermissionService.hasPermission

afterEach(() => {
  AuthService.getSession = originalGetSession
  PermissionService.hasPermission = originalHasPermission
})

describe('permissionPlugin', () => {
  it('should reject unauthenticated access with 401 before permission checks', async () => {
    const checkedPermissions: string[] = []

    AuthService.getSession = async () => createSessionResponse(null)
    PermissionService.hasPermission = async (_userId, permission) => {
      checkedPermissions.push(permission)
      return true
    }

    const app = new Elysia()
      .use(errorPlugin)
      .use(permissionPlugin)
      .get('/users', () => ({ ok: true }), {
        beforeHandle: [permit.permission(Permissions.USER.READ_ALL)],
      })

    const { response, body } = await requestJson(app, '/users')

    expect(response.status).toBe(401)
    expect(body).toMatchObject({
      code: 401,
      message: '请先登录',
      data: null,
      errorCode: 'UNAUTHORIZED',
    })
    expect(checkedPermissions).toEqual([])
  })

  it('should allow access when the explicit permission exists', async () => {
    AuthService.getSession = async () => createSessionResponse('user-1')
    PermissionService.hasPermission = async () => true

    const app = new Elysia()
      .use(errorPlugin)
      .use(permissionPlugin)
      .get('/users', () => ({ ok: true }), {
        beforeHandle: [permit.permission(Permissions.USER.READ_ALL)],
      })

    const { response, body } = await requestJson(app, '/users')

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true })
  })

  it('should allow own guard to fall back to all-scope permission', async () => {
    const checkedPermissions: string[] = []

    AuthService.getSession = async () => createSessionResponse('user-1')
    PermissionService.hasPermission = async (_userId, permission) => {
      checkedPermissions.push(permission)
      return permission === Permissions.USER.READ_ALL
    }

    const app = new Elysia()
      .use(errorPlugin)
      .use(permissionPlugin)
      .get('/users/:id', () => ({ ok: true }), {
        beforeHandle: [permit.own(Permissions.USER.READ_OWN)],
      })

    const { response, body } = await requestJson(app, '/users/user-2')

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(checkedPermissions).toEqual([Permissions.USER.READ_ALL])
  })

  it('should reject me guard when neither base nor own permission exists', async () => {
    const checkedPermissions: string[] = []

    AuthService.getSession = async () => createSessionResponse('user-1')
    PermissionService.hasPermission = async (_userId, permission) => {
      checkedPermissions.push(permission)
      return false
    }

    const app = new Elysia()
      .use(errorPlugin)
      .use(permissionPlugin)
      .get('/users/me/permissions', () => ({ ok: true }), {
        beforeHandle: [permit.me(Permissions.USER_PERMISSION.READ_OWN)],
      })

    const { response, body } = await requestJson(app, '/users/me/permissions')

    expect(response.status).toBe(403)
    expect(body).toMatchObject({
      code: 403,
      message: '权限不足',
      data: null,
      errorCode: 'FORBIDDEN',
    })
    expect(checkedPermissions).toEqual(['user_permission:read', Permissions.USER_PERMISSION.READ_OWN])
  })
})
