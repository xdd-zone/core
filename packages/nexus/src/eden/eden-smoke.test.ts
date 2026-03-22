import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { edenTreaty } from '@elysiajs/eden'
import { createApp } from '@/app'
import { prisma } from '@/infra/database'

const app = createApp()
app.listen(0)

const baseUrl = `http://localhost:${app.server?.port}`
const anonymousClient = edenTreaty<ReturnType<typeof createApp>>(baseUrl)

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

      const response = await fetch(input, {
        ...init,
        headers,
      })

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

const authenticatedClient = edenTreaty<ReturnType<typeof createApp>>(baseUrl, {
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

const emptyRequest = {
  $query: {},
  $headers: {},
} as const

type RequestBody<T> = T & {
  $query: {}
  $headers: {}
}

type RoleSummary = {
  name: string
}

type RoleAssignmentSummary = {
  roleId: string
}

type UserRoleStatusResponse = {
  id: string
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED'
}

const createdUserIds: string[] = []
let actorUserId = ''
let subjectUserId = ''
let superAdminRoleId = ''
let adminRoleId = ''
let userRoleId = ''

function withRequestMeta<T extends object>(body: T): RequestBody<T> {
  return {
    ...body,
    $query: {},
    $headers: {},
  }
}

beforeAll(async () => {
  const actorResult = await authenticatedClient.api.auth['sign-up'].email.post(withRequestMeta(actorUser))

  expect(actorResult.status).toBe(200)
  expect(actorResult.error).toBeNull()
  expect(actorResult.data?.user?.id).toBeTruthy()

  actorUserId = actorResult.data!.user!.id
  createdUserIds.push(actorUserId)

  const subjectResult = await anonymousClient.api.auth['sign-up'].email.post(withRequestMeta(subjectUser))

  expect(subjectResult.status).toBe(200)
  expect(subjectResult.error).toBeNull()
  expect(subjectResult.data?.user?.id).toBeTruthy()

  subjectUserId = subjectResult.data!.user!.id
  createdUserIds.push(subjectUserId)

  const [superAdminRole, adminRole, userRole] = await Promise.all([
    prisma.role.findUnique({ where: { name: 'superAdmin' } }),
    prisma.role.findUnique({ where: { name: 'admin' } }),
    prisma.role.findUnique({ where: { name: 'user' } }),
  ])

  expect(superAdminRole?.id).toBeTruthy()
  expect(adminRole?.id).toBeTruthy()
  expect(userRole?.id).toBeTruthy()

  superAdminRoleId = superAdminRole!.id
  adminRoleId = adminRole!.id
  userRoleId = userRole!.id

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

  app.stop()
})

describe('eden smoke', () => {
  it('应可访问健康检查与匿名会话接口', async () => {
    const result = await anonymousClient.api.health.get(emptyRequest)

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data).toEqual({
      status: 'ok',
    })
  })

  it('应可访问匿名会话接口', async () => {
    const result = await anonymousClient.api.auth['get-session'].get(emptyRequest)

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data).toEqual({
      user: null,
      session: null,
      isAuthenticated: false,
    })
  })

  it('应可访问登录态会话接口', async () => {
    const result = await authenticatedClient.api.auth.me.get(emptyRequest)

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data?.isAuthenticated).toBe(true)
    expect(result.data?.user?.id).toBe(actorUserId)
  })

  it('应支持当前用户资料查询与更新', async () => {
    const userResult = await authenticatedClient.api.user.me.get(emptyRequest)

    expect(userResult.status).toBe(200)
    expect(userResult.error).toBeNull()
    expect(userResult.data?.id).toBe(actorUserId)

    const updatedName = `Eden Actor Updated ${tempSuffix}`
    const updateResult = await authenticatedClient.api.user.me.patch(
      withRequestMeta({
        name: updatedName,
      }),
    )

    expect(updateResult.status).toBe(200)
    expect(updateResult.error).toBeNull()
    expect(updateResult.data?.id).toBe(actorUserId)
    expect(updateResult.data?.name).toBe(updatedName)

    const refreshedResult = await authenticatedClient.api.user.me.get(emptyRequest)
    expect(refreshedResult.status).toBe(200)
    expect(refreshedResult.error).toBeNull()
    expect(refreshedResult.data?.name).toBe(updatedName)
  })

  it('应支持固定角色列表、用户角色分配与移除', async () => {
    const rolesResult = await authenticatedClient.api.rbac.roles.get(emptyRequest)

    expect(rolesResult.status).toBe(200)
    expect(rolesResult.error).toBeNull()
    const roleNames = (rolesResult.data?.items ?? []).map((role: RoleSummary) => role.name).sort()
    expect(roleNames).toEqual(['admin', 'superAdmin', 'user'])

    const currentUserRolesResult = await authenticatedClient.api.rbac.users.me.roles.get(emptyRequest)
    expect(currentUserRolesResult.status).toBe(200)
    expect(currentUserRolesResult.error).toBeNull()
    expect(currentUserRolesResult.data?.roles.some((role: RoleSummary) => role.name === 'superAdmin')).toBe(true)

    const assignResult = await authenticatedClient.api.rbac.users[subjectUserId].roles.post(
      withRequestMeta({
        roleId: adminRoleId,
      }),
    )

    expect(assignResult.status).toBe(200)
    expect(assignResult.error).toBeNull()
    expect(assignResult.data?.userId).toBe(subjectUserId)
    expect(assignResult.data?.roleId).toBe(adminRoleId)

    const subjectRolesAfterAssign = await authenticatedClient.api.rbac.users[subjectUserId].roles.get(emptyRequest)
    expect(subjectRolesAfterAssign.status).toBe(200)
    expect(subjectRolesAfterAssign.error).toBeNull()
    expect(subjectRolesAfterAssign.data?.some((role: RoleAssignmentSummary) => role.roleId === adminRoleId)).toBe(true)

    const revokeResult = await authenticatedClient.api.rbac.users[subjectUserId].roles[adminRoleId].delete(emptyRequest)
    expect(revokeResult.status).toBe(204)
    expect(revokeResult.error).toBeNull()

    const subjectRolesAfterRevoke = await authenticatedClient.api.rbac.users[subjectUserId].roles.get(emptyRequest)
    expect(subjectRolesAfterRevoke.status).toBe(200)
    expect(subjectRolesAfterRevoke.error).toBeNull()
    expect(subjectRolesAfterRevoke.data?.some((role: RoleAssignmentSummary) => role.roleId === adminRoleId)).toBe(false)
  })

  it('应支持用户状态管理与权限查询', async () => {
    const subjectStatusClient = authenticatedClient.api.user[subjectUserId] as unknown as {
      status: {
        patch: (
          body: RequestBody<{
            status: 'ACTIVE' | 'INACTIVE' | 'BANNED'
          }>,
        ) => Promise<{
          status: number
          error: unknown
          data?: UserRoleStatusResponse
        }>
      }
    }

    const statusResult = await subjectStatusClient.status.patch(
      withRequestMeta({
        status: 'BANNED',
      }),
    )

    expect(statusResult.status).toBe(200)
    expect(statusResult.error).toBeNull()
    expect(statusResult.data?.id).toBe(subjectUserId)
    expect(statusResult.data?.status).toBe('BANNED')

    const subjectPermissionsResult =
      await authenticatedClient.api.rbac.users[subjectUserId].permissions.get(emptyRequest)
    expect(subjectPermissionsResult.status).toBe(200)
    expect(subjectPermissionsResult.error).toBeNull()
    expect(subjectPermissionsResult.data?.permissions.includes('user:read:own')).toBe(true)

    const currentUserPermissionsResult = await authenticatedClient.api.rbac.users.me.permissions.get(emptyRequest)
    expect(currentUserPermissionsResult.status).toBe(200)
    expect(currentUserPermissionsResult.error).toBeNull()
    expect(currentUserPermissionsResult.data?.permissions.includes('system:manage')).toBe(true)
    expect(currentUserPermissionsResult.data?.roles.some((role: RoleSummary) => role.name === 'superAdmin')).toBe(true)
  })
})
