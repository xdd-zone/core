import type { App } from '@nexus/eden'
import { treaty } from '@elysiajs/eden'
import { createApp } from '@nexus/app'
import { prisma } from '@nexus/infra/database'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'

const app = createApp()
const baseUrl = 'http://localhost'
const authBaseUrl = 'http://localhost:7788'

function createCookieFetcher() {
  const cookies = new Map<string, string>()

  const fetcher = Object.assign(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      const cookieHeader = Array.from(cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ')

      if (cookieHeader) {
        headers.set('cookie', cookieHeader)
      }

      const request = new Request(input, {
        ...init,
        headers,
      })

      const response = await app.handle(request)

      const responseHeaders = response.headers as Headers & {
        getSetCookie?: () => string[]
      }

      const setCookieHeaders =
        typeof responseHeaders.getSetCookie === 'function'
          ? responseHeaders.getSetCookie()
          : response.headers.get('set-cookie')
            ? [response.headers.get('set-cookie') as string]
            : []

      for (const cookie of setCookieHeaders) {
        const cookieNameValue = cookie.split(';')[0]?.trim()
        if (!cookieNameValue) {
          continue
        }

        const separatorIndex = cookieNameValue.indexOf('=')
        if (separatorIndex <= 0) {
          continue
        }

        const name = cookieNameValue.slice(0, separatorIndex)
        const value = cookieNameValue.slice(separatorIndex + 1)
        cookies.set(name, value)
      }

      return response
    },
    {
      preconnect: fetch.preconnect.bind(fetch),
    },
  ) as typeof fetch

  return fetcher
}

const directFetcher = Object.assign(
  async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init)
    return await app.handle(request)
  },
  {
    preconnect: fetch.preconnect.bind(fetch),
  },
) as typeof fetch

const anonymousClient = treaty<App>(baseUrl, {
  fetcher: directFetcher,
})

const authenticatedClient = treaty<App>(baseUrl, {
  fetcher: createCookieFetcher(),
})

const tempSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const actorUser = {
  email: `eden-actor-${tempSuffix}@example.com`,
  password: 'eden-smoke-pass-123',
  name: `Eden Actor ${tempSuffix}`,
}

const subjectUser = {
  email: `eden-subject-${tempSuffix}@example.com`,
  password: 'eden-smoke-pass-123',
  name: `Eden Subject ${tempSuffix}`,
}

interface RoleSummary {
  name: string
}

interface RoleAssignmentSummary {
  roleId: string
}

const createdUserIds: string[] = []
let actorUserId = ''
let subjectUserId = ''
let superAdminRoleId = ''
let adminRoleId = ''
let userRoleId = ''

beforeAll(async () => {
  const actorResult = await authenticatedClient.api.auth['sign-up'].email.post(actorUser)

  expect(actorResult.status).toBe(200)
  expect(actorResult.error).toBeNull()
  const actorId = actorResult.data?.user?.id
  expect(actorId).toBeTruthy()
  if (!actorId) {
    throw new Error('缺少 actor 用户 ID')
  }

  actorUserId = actorId
  createdUserIds.push(actorUserId)

  const subjectResult = await anonymousClient.api.auth['sign-up'].email.post(subjectUser)

  expect(subjectResult.status).toBe(200)
  expect(subjectResult.error).toBeNull()
  const subjectId = subjectResult.data?.user?.id
  expect(subjectId).toBeTruthy()
  if (!subjectId) {
    throw new Error('缺少 subject 用户 ID')
  }

  subjectUserId = subjectId
  createdUserIds.push(subjectUserId)

  const [superAdminRole, adminRole, userRole] = await Promise.all([
    prisma.role.findUnique({ where: { name: 'superAdmin' } }),
    prisma.role.findUnique({ where: { name: 'admin' } }),
    prisma.role.findUnique({ where: { name: 'user' } }),
  ])

  const nextSuperAdminRoleId = superAdminRole?.id
  const nextAdminRoleId = adminRole?.id
  const nextUserRoleId = userRole?.id

  expect(nextSuperAdminRoleId).toBeTruthy()
  expect(nextAdminRoleId).toBeTruthy()
  expect(nextUserRoleId).toBeTruthy()

  if (!nextSuperAdminRoleId || !nextAdminRoleId || !nextUserRoleId) {
    throw new Error('缺少默认角色 ID')
  }

  superAdminRoleId = nextSuperAdminRoleId
  adminRoleId = nextAdminRoleId
  userRoleId = nextUserRoleId

  const ensureUserRole = async (userId: string, roleId: string, assignedBy: string | null) => {
    const existing = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
      },
    })

    if (existing) {
      return
    }

    await prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy,
      },
    })
  }

  await ensureUserRole(actorUserId, superAdminRoleId, actorUserId)
  await ensureUserRole(subjectUserId, userRoleId, actorUserId)
})

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.userRole.deleteMany({
      where: {
        userId: {
          in: createdUserIds,
        },
      },
    })

    await prisma.session.deleteMany({
      where: {
        userId: {
          in: createdUserIds,
        },
      },
    })

    await prisma.account.deleteMany({
      where: {
        userId: {
          in: createdUserIds,
        },
      },
    })

    await prisma.user.deleteMany({
      where: {
        id: {
          in: createdUserIds,
        },
      },
    })
  }
})

describe('eden smoke', () => {
  it('应可访问健康检查与匿名会话接口', async () => {
    const result = await anonymousClient.api.health.get()

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data).toEqual({
      status: 'ok',
    })
  })

  it('应可访问匿名会话接口', async () => {
    const result = await anonymousClient.api.auth['get-session'].get()

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data).toEqual({
      user: null,
      session: null,
      isAuthenticated: false,
    })
  })

  it('应支持 GitHub 登录跳转，并在入口参数错误时回跳登录页', async () => {
    const validResponse = await app.handle(
      new Request(
        `${authBaseUrl}/api/auth/sign-in/github?callbackURL=${encodeURIComponent('http://localhost:2333/dashboard')}`,
        {
          headers: {
            referer: 'http://localhost:2333/login?redirect=%2Fdashboard',
          },
        },
      ),
    )

    expect(validResponse.status).toBe(302)
    expect(validResponse.headers.get('location')).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize/)
    expect(validResponse.headers.get('set-cookie')).toContain('better-auth.state=')

    const invalidResponse = await app.handle(
      new Request(
        `${authBaseUrl}/api/auth/sign-in/github?callbackURL=${encodeURIComponent('https://evil.example/dashboard')}`,
        {
          headers: {
            referer: 'http://localhost:2333/login?redirect=%2Fdashboard',
          },
        },
      ),
    )

    expect(invalidResponse.status).toBe(302)

    const invalidLocation = invalidResponse.headers.get('location')
    expect(invalidLocation).toBeTruthy()
    if (!invalidLocation) {
      throw new Error('缺少 GitHub 登录失败回跳地址')
    }

    const invalidRedirectUrl = new URL(invalidLocation)
    expect(`${invalidRedirectUrl.origin}${invalidRedirectUrl.pathname}`).toBe('http://localhost:2333/login')
    expect(invalidRedirectUrl.searchParams.get('error')).toBe('invalid_callback_url')
    expect(invalidRedirectUrl.searchParams.get('redirect')).toBe('/dashboard')
  })

  it('应可访问登录态会话接口', async () => {
    const result = await authenticatedClient.api.auth.me.get()

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data?.isAuthenticated).toBe(true)
    expect(result.data?.user?.id).toBe(actorUserId)
  })

  it('应支持当前用户资料查询与更新', async () => {
    const userResult = await authenticatedClient.api.user.me.get()

    expect(userResult.status).toBe(200)
    expect(userResult.error).toBeNull()
    expect(userResult.data?.id).toBe(actorUserId)

    const updatedName = `Eden Actor Updated ${tempSuffix}`
    const updateResult = await authenticatedClient.api.user.me.patch({
      name: updatedName,
    })

    expect(updateResult.status).toBe(200)
    expect(updateResult.error).toBeNull()
    expect(updateResult.data?.id).toBe(actorUserId)
    expect(updateResult.data?.name).toBe(updatedName)

    const refreshedResult = await authenticatedClient.api.user.me.get()
    expect(refreshedResult.status).toBe(200)
    expect(refreshedResult.error).toBeNull()
    expect(refreshedResult.data?.name).toBe(updatedName)
  })

  it('应支持固定角色列表、用户角色分配与移除', async () => {
    const rolesResult = await authenticatedClient.api.rbac.roles.get()

    expect(rolesResult.status).toBe(200)
    expect(rolesResult.error).toBeNull()
    const roleNames = (rolesResult.data?.items ?? []).map((role: RoleSummary) => role.name).sort()
    expect(roleNames).toEqual(['admin', 'superAdmin', 'user'])

    const currentUserRolesResult = await authenticatedClient.api.rbac.users.me.roles.get()
    expect(currentUserRolesResult.status).toBe(200)
    expect(currentUserRolesResult.error).toBeNull()
    expect(currentUserRolesResult.data?.roles.some((role: RoleSummary) => role.name === 'superAdmin')).toBe(true)

    const assignResult = await authenticatedClient.api.rbac.users({ userId: subjectUserId }).roles.post({
      roleId: adminRoleId,
    })

    expect(assignResult.status).toBe(200)
    expect(assignResult.error).toBeNull()
    expect(assignResult.data?.userId).toBe(subjectUserId)
    expect(assignResult.data?.roleId).toBe(adminRoleId)

    const subjectRolesAfterAssign = await authenticatedClient.api.rbac.users({ userId: subjectUserId }).roles.get()
    expect(subjectRolesAfterAssign.status).toBe(200)
    expect(subjectRolesAfterAssign.error).toBeNull()
    expect(subjectRolesAfterAssign.data?.some((role: RoleAssignmentSummary) => role.roleId === adminRoleId)).toBe(true)

    const revokeResult = await authenticatedClient.api.rbac
      .users({ userId: subjectUserId })
      .roles({
        roleId: adminRoleId,
      })
      .delete()
    expect(revokeResult.status).toBe(204)
    expect(revokeResult.error).toBeNull()

    const subjectRolesAfterRevoke = await authenticatedClient.api.rbac.users({ userId: subjectUserId }).roles.get()
    expect(subjectRolesAfterRevoke.status).toBe(200)
    expect(subjectRolesAfterRevoke.error).toBeNull()
    expect(subjectRolesAfterRevoke.data?.some((role: RoleAssignmentSummary) => role.roleId === adminRoleId)).toBe(false)
  })

  it('应支持用户状态管理与权限查询', async () => {
    const statusResult = await authenticatedClient.api.user({ id: subjectUserId }).status.patch({
      status: 'BANNED',
    })

    expect(statusResult.status).toBe(200)
    expect(statusResult.error).toBeNull()
    expect(statusResult.data?.id).toBe(subjectUserId)
    expect(statusResult.data?.status).toBe('BANNED')

    const subjectPermissionsResult = await authenticatedClient.api.rbac
      .users({ userId: subjectUserId })
      .permissions
      .get()
    expect(subjectPermissionsResult.status).toBe(200)
    expect(subjectPermissionsResult.error).toBeNull()
    expect(subjectPermissionsResult.data?.permissions.some((permission) => permission.key === 'user:read:own')).toBe(
      true,
    )

    const currentUserPermissionsResult = await authenticatedClient.api.rbac.users.me.permissions.get()
    expect(currentUserPermissionsResult.status).toBe(200)
    expect(currentUserPermissionsResult.error).toBeNull()
    expect(
      currentUserPermissionsResult.data?.permissions.some((permission) => permission.key === 'system:manage'),
    ).toBe(true)
    expect(currentUserPermissionsResult.data?.roles.some((role: RoleSummary) => role.name === 'superAdmin')).toBe(true)
  })
})
