import type { SiteConfigRecord } from '../modules/site-config/repository'
import type { App } from '../public/eden'

import { treaty } from '@elysiajs/eden'
import { Prisma } from '@nexus/infra/database/prisma/generated/client'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import pino from 'pino'
import { createApp } from '../app'
import { createAppContext } from '../bootstrap'
import { parsePermission, Permissions, PermissionService, SYSTEM_PERMISSION_DEFINITIONS } from '../core/security'
import { prisma } from '../infra/database'
import { seedPermissions } from '../infra/database/prisma/seed/seeds/seed-permissions'
import { seedRolePermissions } from '../infra/database/prisma/seed/seeds/seed-role-permissions'
import { seedRoles } from '../infra/database/prisma/seed/seeds/seed-roles'
import { SiteConfigRepository } from '../modules/site-config/repository'

const appContext = createAppContext({
  auth: {
    methods: {
      emailPassword: {
        enabled: true,
        allowSignUp: true,
      },
    },
  },
})

const app = createApp(appContext)
const baseUrl = 'http://localhost'
const authBaseUrl = 'http://localhost:7788'
const seedLogger = pino({ level: 'silent' })
const siteConfigResetFields = {
  subtitle: null,
  description: null,
  logo: null,
  favicon: null,
  footerText: null,
  socialLinks: Prisma.JsonNull,
  defaultSeoTitle: null,
  defaultSeoDescription: null,
} satisfies Prisma.SiteConfigUpdateInput

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

  return {
    fetcher,
    setCookie(name: string, value: string) {
      cookies.set(name, value)
    },
  }
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

const authenticatedCookieSession = createCookieFetcher()
const subjectCookieSession = createCookieFetcher()
const signOutCookieSession = createCookieFetcher()

const authenticatedClient = treaty<App>(baseUrl, {
  fetcher: authenticatedCookieSession.fetcher,
})

const subjectClient = treaty<App>(baseUrl, {
  fetcher: subjectCookieSession.fetcher,
})

const signOutClient = treaty<App>(baseUrl, {
  fetcher: signOutCookieSession.fetcher,
})

function getPostClient(postId: string): ReturnType<typeof authenticatedClient.api.post> {
  return (authenticatedClient.api.post as unknown as Record<string, ReturnType<typeof authenticatedClient.api.post>>)[
    postId
  ]
}

function getCategoryClient(categoryId: string): ReturnType<typeof authenticatedClient.api.category> {
  return (
    authenticatedClient.api.category as unknown as Record<string, ReturnType<typeof authenticatedClient.api.category>>
  )[categoryId]
}

function getSubjectPostClient(postId: string): ReturnType<typeof subjectClient.api.post> {
  return (subjectClient.api.post as unknown as Record<string, ReturnType<typeof subjectClient.api.post>>)[postId]
}

function getCommentClient(commentId: string): ReturnType<typeof authenticatedClient.api.comment> {
  return (
    authenticatedClient.api.comment as unknown as Record<string, ReturnType<typeof authenticatedClient.api.comment>>
  )[commentId]
}

function getMediaClient(mediaId: string): ReturnType<typeof authenticatedClient.api.media> {
  return (authenticatedClient.api.media as unknown as Record<string, ReturnType<typeof authenticatedClient.api.media>>)[
    mediaId
  ]
}

const publicSiteClient = anonymousClient.api['public-site']

function expectValidDateTime(value: unknown) {
  expect(value instanceof Date || typeof value === 'string').toBe(true)
  expect(Number.isNaN(new Date(value as string | Date).getTime())).toBe(false)
}

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
const createdPostIds: string[] = []
const createdCategoryIds: string[] = []
const createdCommentIds: string[] = []
const createdMediaIds: string[] = []
const createdRoleIds: string[] = []

async function createRoleWithPermissions(name: string, permissionKeys: readonly string[]) {
  const permissionIds = await Promise.all(
    permissionKeys.map(async (permissionKey) => {
      const parsedPermission = parsePermission(permissionKey as Parameters<typeof parsePermission>[0])
      const permission = await prisma.permission.findUnique({
        where: {
          resource_action_scope: {
            resource: parsedPermission.resource,
            action: parsedPermission.action,
            scope: parsedPermission.scope ?? '',
          },
        },
        select: {
          id: true,
        },
      })

      if (permission) {
        return permission.id
      }

      const definition = SYSTEM_PERMISSION_DEFINITIONS.find((item) => item.key === permissionKey)
      const createdPermission = await prisma.permission.create({
        data: {
          resource: parsedPermission.resource,
          action: parsedPermission.action,
          scope: parsedPermission.scope ?? '',
          displayName: definition?.displayName ?? permissionKey,
          description: definition?.description ?? permissionKey,
        },
        select: {
          id: true,
        },
      })

      return createdPermission.id
    }),
  )

  const role = await prisma.role.create({
    data: {
      name,
      displayName: name,
      description: `Smoke role for ${name}`,
      isSystem: false,
    },
  })

  createdRoleIds.push(role.id)

  await prisma.rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({
      roleId: role.id,
      permissionId,
    })),
  })

  return role
}

async function createCommentTargetPost(status: 'PUBLISHED' | 'DRAFT', slugPrefix: string) {
  const post = await prisma.post.create({
    data: {
      title: `${slugPrefix} ${tempSuffix}`,
      slug: `${slugPrefix}-${tempSuffix}`,
      markdown: `# ${slugPrefix}`,
      tags: [],
      status,
    },
  })

  createdPostIds.push(post.id)

  return post
}

async function createPendingComment(postId: string, contentPrefix: string) {
  const result = await anonymousClient.api.comment.post({
    postId,
    authorName: 'Alice',
    authorEmail: 'alice@example.com',
    content: `${contentPrefix} ${tempSuffix}`,
  })

  expect(result.status).toBe(200)
  expect(result.error).toBeNull()

  const commentId = result.data?.id
  expect(commentId).toBeTruthy()
  if (!commentId) {
    throw new Error('评论创建失败')
  }

  createdCommentIds.push(commentId)

  return {
    result,
    commentId,
  }
}
let originalSiteConfigRecord: SiteConfigRecord | null = null
let actorUserId = ''
let subjectUserId = ''
let superAdminRoleId = ''
let userRoleId = ''

beforeAll(async () => {
  originalSiteConfigRecord = await SiteConfigRepository.findDefault()

  await seedRoles(prisma, seedLogger)
  await seedPermissions(prisma, seedLogger)
  await seedRolePermissions(prisma, seedLogger)

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
  const subjectSignInResult = await subjectClient.api.auth['sign-in'].email.post({
    email: subjectUser.email,
    password: subjectUser.password,
  })
  expect(subjectSignInResult.status).toBe(200)
  expect(subjectSignInResult.error).toBeNull()
  expect(subjectId).toBeTruthy()
  if (!subjectId) {
    throw new Error('缺少 subject 用户 ID')
  }

  subjectUserId = subjectId
  createdUserIds.push(subjectUserId)

  const [superAdminRole, userRole] = await Promise.all([
    prisma.role.findUnique({ where: { name: 'superAdmin' } }),
    prisma.role.findUnique({ where: { name: 'user' } }),
  ])

  const nextSuperAdminRoleId = superAdminRole?.id
  const nextUserRoleId = userRole?.id

  expect(nextSuperAdminRoleId).toBeTruthy()
  expect(nextUserRoleId).toBeTruthy()

  if (!nextSuperAdminRoleId || !nextUserRoleId) {
    throw new Error('缺少默认角色 ID')
  }

  superAdminRoleId = nextSuperAdminRoleId
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
  if (originalSiteConfigRecord) {
    await SiteConfigRepository.restoreDefault(originalSiteConfigRecord)
  } else {
    await SiteConfigRepository.deleteDefault().catch(() => undefined)
  }

  if (createdCommentIds.length > 0) {
    await prisma.comment.deleteMany({
      where: {
        id: {
          in: createdCommentIds,
        },
      },
    })
  }

  if (createdPostIds.length > 0) {
    await prisma.post.deleteMany({
      where: {
        id: {
          in: createdPostIds,
        },
      },
    })
  }

  if (createdCategoryIds.length > 0) {
    await prisma.category.deleteMany({
      where: {
        id: {
          in: createdCategoryIds,
        },
      },
    })
  }

  if (createdMediaIds.length > 0) {
    await prisma.media.deleteMany({
      where: {
        id: {
          in: createdMediaIds,
        },
      },
    })
  }

  if (createdRoleIds.length > 0) {
    await prisma.role.deleteMany({
      where: {
        id: {
          in: createdRoleIds,
        },
      },
    })
  }

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
    expect(result.data).toMatchObject({
      status: 'ok',
      service: appContext.config.app.name,
      version: appContext.config.openapi.version,
      database: {
        status: 'up',
      },
    })
    const timestamp = result.data?.timestamp as unknown
    expectValidDateTime(timestamp)
    expect(typeof result.data?.uptime).toBe('number')
    expect((result.data?.uptime ?? -1) >= 0).toBe(true)
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

  it('应可读取当前登录方式开关', async () => {
    const result = await anonymousClient.api.auth.methods.get()

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data?.methods).toEqual([
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
        enabled: appContext.config.auth.methods.github.enabled,
        allowSignUp: appContext.config.auth.methods.github.allowSignUp,
        implemented: true,
        entryPath: '/api/auth/sign-in/github',
      },
      {
        id: 'google',
        kind: 'oauth',
        enabled: appContext.config.auth.methods.google.enabled,
        allowSignUp: appContext.config.auth.methods.google.allowSignUp,
        implemented: false,
        entryPath: null,
      },
      {
        id: 'wechat',
        kind: 'oauth',
        enabled: appContext.config.auth.methods.wechat.enabled,
        allowSignUp: appContext.config.auth.methods.wechat.allowSignUp,
        implemented: false,
        entryPath: null,
      },
    ])
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

  it('登出后应清除当前会话', async () => {
    const signInResult = await signOutClient.api.auth['sign-in'].email.post({
      email: subjectUser.email,
      password: subjectUser.password,
    })
    expect(signInResult.status).toBe(200)
    expect(signInResult.error).toBeNull()

    const signOutResult = await signOutClient.api.auth['sign-out'].post()
    expect(signOutResult.status).toBe(204)
    expect(signOutResult.error).toBeNull()

    const meResult = await signOutClient.api.auth.me.get()
    expect(meResult.status).toBe(401)
    expect(meResult.error).toBeTruthy()
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

  it('无权限用户访问用户管理接口应返回 403', async () => {
    const listResult = await subjectClient.api.user.get()
    expect(listResult.status).toBe(403)
    expect(listResult.error).toBeTruthy()

    const detailResult = await subjectClient.api.user({ id: actorUserId }).get()
    expect(detailResult.status).toBe(403)
    expect(detailResult.error).toBeTruthy()

    const statusResult = await subjectClient.api.user({ id: actorUserId }).status.patch({
      status: 'INACTIVE',
    })
    expect(statusResult.status).toBe(403)
    expect(statusResult.error).toBeTruthy()
  })

  it('管理员可读取用户列表、详情并更新用户状态', async () => {
    const listResult = await authenticatedClient.api.user.get({
      query: {
        keyword: subjectUser.email,
        status: 'ACTIVE',
      },
    })
    expect(listResult.status).toBe(200)
    expect(listResult.error).toBeNull()
    expect(listResult.data?.items.some((item) => item.id === subjectUserId)).toBe(true)

    const detailResult = await authenticatedClient.api.user({ id: subjectUserId }).get()
    expect(detailResult.status).toBe(200)
    expect(detailResult.error).toBeNull()
    expect(detailResult.data?.id).toBe(subjectUserId)

    const inactiveResult = await authenticatedClient.api.user({ id: subjectUserId }).status.patch({
      status: 'INACTIVE',
    })
    expect(inactiveResult.status).toBe(200)
    expect(inactiveResult.error).toBeNull()
    expect(inactiveResult.data?.status).toBe('INACTIVE')

    const activeResult = await authenticatedClient.api.user({ id: subjectUserId }).status.patch({
      status: 'ACTIVE',
    })
    expect(activeResult.status).toBe(200)
    expect(activeResult.error).toBeNull()
    expect(activeResult.data?.status).toBe('ACTIVE')
  })

  it('应支持固定角色列表、用户角色分配与移除', async () => {
    const rolesResult = await authenticatedClient.api.rbac.roles.get()

    expect(rolesResult.status).toBe(200)
    expect(rolesResult.error).toBeNull()
    const roleNames = (rolesResult.data?.items ?? []).map((role: RoleSummary) => role.name).sort()
    expect(roleNames).toEqual(['superAdmin', 'user'])

    const currentUserRolesResult = await authenticatedClient.api.rbac.users.me.roles.get()
    expect(currentUserRolesResult.status).toBe(200)
    expect(currentUserRolesResult.error).toBeNull()
    expect(currentUserRolesResult.data?.roles.some((role: RoleSummary) => role.name === 'superAdmin')).toBe(true)

    const assignResult = await authenticatedClient.api.rbac.users({ userId: subjectUserId }).roles.post({
      roleId: superAdminRoleId,
    })

    expect(assignResult.status).toBe(200)
    expect(assignResult.error).toBeNull()
    expect(assignResult.data?.userId).toBe(subjectUserId)
    expect(assignResult.data?.roleId).toBe(superAdminRoleId)

    const subjectRolesAfterAssign = await authenticatedClient.api.rbac.users({ userId: subjectUserId }).roles.get()
    expect(subjectRolesAfterAssign.status).toBe(200)
    expect(subjectRolesAfterAssign.error).toBeNull()
    expect(subjectRolesAfterAssign.data?.some((role: RoleAssignmentSummary) => role.roleId === superAdminRoleId)).toBe(
      true,
    )

    const revokeResult = await authenticatedClient.api.rbac
      .users({ userId: subjectUserId })
      .roles({
        roleId: superAdminRoleId,
      })
      .delete()
    expect(revokeResult.status).toBe(204)
    expect(revokeResult.error).toBeNull()

    const subjectRolesAfterRevoke = await authenticatedClient.api.rbac.users({ userId: subjectUserId }).roles.get()
    expect(subjectRolesAfterRevoke.status).toBe(200)
    expect(subjectRolesAfterRevoke.error).toBeNull()
    expect(subjectRolesAfterRevoke.data?.some((role: RoleAssignmentSummary) => role.roleId === superAdminRoleId)).toBe(
      false,
    )
  })

  it('首次读取站点配置时应创建默认配置', async () => {
    if (originalSiteConfigRecord) {
      await SiteConfigRepository.deleteDefault()
    }

    const result = await authenticatedClient.api['site-config'].get()

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data?.id).toBe('default')
    expect(result.data?.title).toBe('XDD Zone')
    expect(result.data?.socialLinks).toEqual({})
  })

  it('首次直接更新站点配置时应保留默认标题', async () => {
    await SiteConfigRepository.deleteDefault()

    const result = await authenticatedClient.api['site-config'].put({
      subtitle: `First subtitle ${tempSuffix}`,
    })

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data?.id).toBe('default')
    expect(result.data?.title).toBe('XDD Zone')
    expect(result.data?.subtitle).toBe(`First subtitle ${tempSuffix}`)
  })

  it('应拒绝未登录访问站点配置', async () => {
    const result = await anonymousClient.api['site-config'].get()

    expect(result.status).toBe(401)
    expect(result.error).toBeTruthy()
  })

  it('匿名用户应可读取个人站点配置', async () => {
    await SiteConfigRepository.deleteDefault()

    const defaultResult = await publicSiteClient.config.get()
    expect(defaultResult.status).toBe(200)
    expect(defaultResult.error).toBeNull()
    expect(defaultResult.data?.title).toBe('XDD Zone')
    expect(defaultResult.data?.socialLinks).toEqual({})

    const updateResult = await authenticatedClient.api['site-config'].put({
      title: `Public Site ${tempSuffix}`,
      subtitle: `Public Subtitle ${tempSuffix}`,
      description: `Public Description ${tempSuffix}`,
      logo: 'https://example.com/logo.png',
      favicon: 'https://example.com/favicon.ico',
      footerText: `Footer ${tempSuffix}`,
      socialLinks: {
        github: 'https://github.com/xdd-zone',
      },
      defaultSeoTitle: `SEO ${tempSuffix}`,
      defaultSeoDescription: `SEO Description ${tempSuffix}`,
    })
    expect(updateResult.status).toBe(200)
    expect(updateResult.error).toBeNull()

    const publicResult = await publicSiteClient.config.get()
    expect(publicResult.status).toBe(200)
    expect(publicResult.error).toBeNull()
    expect(publicResult.data).toEqual({
      title: `Public Site ${tempSuffix}`,
      subtitle: `Public Subtitle ${tempSuffix}`,
      description: `Public Description ${tempSuffix}`,
      logo: 'https://example.com/logo.png',
      favicon: 'https://example.com/favicon.ico',
      footerText: `Footer ${tempSuffix}`,
      socialLinks: {
        github: 'https://github.com/xdd-zone',
      },
      defaultSeoTitle: `SEO ${tempSuffix}`,
      defaultSeoDescription: `SEO Description ${tempSuffix}`,
    })
  })

  it('已登录但没有 SITE_CONFIG 权限时应返回 403', async () => {
    const getResult = await subjectClient.api['site-config'].get()
    expect(getResult.status).toBe(403)
    expect(getResult.error).toBeTruthy()

    const updateResult = await subjectClient.api['site-config'].put({
      title: `Forbidden ${tempSuffix}`,
    })
    expect(updateResult.status).toBe(403)
    expect(updateResult.error).toBeTruthy()
  })

  it('站点配置空 body 或非法 URL 时应返回 422', async () => {
    const emptyBodyResult = await authenticatedClient.api['site-config'].put({})
    expect(emptyBodyResult.status).toBe(422)
    expect(emptyBodyResult.error).toBeTruthy()

    const invalidLogoResult = await authenticatedClient.api['site-config'].put({
      logo: 'invalid-url',
    })
    expect(invalidLogoResult.status).toBe(422)
    expect(invalidLogoResult.error).toBeTruthy()

    const invalidFaviconResult = await authenticatedClient.api['site-config'].put({
      favicon: 'not-a-url',
    })
    expect(invalidFaviconResult.status).toBe(422)
    expect(invalidFaviconResult.error).toBeTruthy()
  })

  it('站点配置应支持将可空字段更新为 null', async () => {
    await SiteConfigRepository.ensureDefault({
      title: 'XDD Zone',
    })

    await prisma.siteConfig.update({
      where: { id: 'default' },
      data: siteConfigResetFields,
    })

    const updateResult = await authenticatedClient.api['site-config'].put({
      title: `Nullable Site ${tempSuffix}`,
      subtitle: `Nullable Subtitle ${tempSuffix}`,
      description: `Nullable Description ${tempSuffix}`,
      footerText: `Nullable Footer ${tempSuffix}`,
      defaultSeoTitle: `Nullable SEO Title ${tempSuffix}`,
      defaultSeoDescription: `Nullable SEO Description ${tempSuffix}`,
    })

    expect(updateResult.status).toBe(200)
    expect(updateResult.error).toBeNull()

    const clearResult = await authenticatedClient.api['site-config'].put({
      subtitle: null,
      description: null,
      footerText: null,
      defaultSeoTitle: null,
      defaultSeoDescription: null,
    })

    expect(clearResult.status).toBe(200)
    expect(clearResult.error).toBeNull()
    expect(clearResult.data?.subtitle).toBeNull()
    expect(clearResult.data?.description).toBeNull()
    expect(clearResult.data?.footerText).toBeNull()
    expect(clearResult.data?.defaultSeoTitle).toBeNull()
    expect(clearResult.data?.defaultSeoDescription).toBeNull()

    const getResult = await authenticatedClient.api['site-config'].get()
    expect(getResult.status).toBe(200)
    expect(getResult.error).toBeNull()
    expect(getResult.data?.subtitle).toBeNull()
    expect(getResult.data?.description).toBeNull()
    expect(getResult.data?.footerText).toBeNull()
    expect(getResult.data?.defaultSeoTitle).toBeNull()
    expect(getResult.data?.defaultSeoDescription).toBeNull()
  })

  it('站点配置应支持将 socialLinks 更新为空对象', async () => {
    const updateResult = await authenticatedClient.api['site-config'].put({
      socialLinks: {
        github: 'https://github.com/xdd-zone',
      },
    })

    expect(updateResult.status).toBe(200)
    expect(updateResult.error).toBeNull()
    expect(updateResult.data?.socialLinks).toEqual({
      github: 'https://github.com/xdd-zone',
    })

    const clearResult = await authenticatedClient.api['site-config'].put({
      socialLinks: {},
    })

    expect(clearResult.status).toBe(200)
    expect(clearResult.error).toBeNull()
    expect(clearResult.data?.socialLinks).toEqual({})

    const getResult = await authenticatedClient.api['site-config'].get()
    expect(getResult.status).toBe(200)
    expect(getResult.error).toBeNull()
    expect(getResult.data?.socialLinks).toEqual({})
  })

  it('应支持更新站点配置并再次读取最新值', async () => {
    const updateResult = await authenticatedClient.api['site-config'].put({
      title: `XDD Blog ${tempSuffix}`,
      subtitle: `Notes ${tempSuffix}`,
      description: `Personal blog backend ${tempSuffix}`,
      logo: 'https://example.com/logo.svg',
      favicon: 'https://example.com/favicon.ico',
      footerText: `Powered by XDD ${tempSuffix}`,
      socialLinks: {
        github: 'https://github.com/xdd-zone',
        rss: 'https://example.com/rss.xml',
      },
      defaultSeoTitle: `Default SEO ${tempSuffix}`,
      defaultSeoDescription: `Default SEO description ${tempSuffix}`,
    })

    expect(updateResult.status).toBe(200)
    expect(updateResult.error).toBeNull()
    expect(updateResult.data?.title).toBe(`XDD Blog ${tempSuffix}`)
    expect(updateResult.data?.socialLinks).toEqual({
      github: 'https://github.com/xdd-zone',
      rss: 'https://example.com/rss.xml',
    })
    expect(updateResult.data?.footerText).toBe(`Powered by XDD ${tempSuffix}`)

    const getResult = await authenticatedClient.api['site-config'].get()
    expect(getResult.status).toBe(200)
    expect(getResult.error).toBeNull()
    expect(getResult.data).toEqual(updateResult.data)
  })

  it('应支持分类创建、列表、更新和删除', async () => {
    const slug = `eden-category-${tempSuffix}`
    const createResult = await authenticatedClient.api.category.post({
      name: `  Engineering ${tempSuffix}  `,
      slug,
      description: `  Category description ${tempSuffix}  `,
      sortOrder: 10,
      isVisible: false,
    })

    expect(createResult.status).toBe(200)
    expect(createResult.error).toBeNull()
    expect(createResult.data?.name).toBe(`Engineering ${tempSuffix}`)
    expect(createResult.data?.slug).toBe(slug)
    expect(createResult.data?.description).toBe(`Category description ${tempSuffix}`)
    expect(createResult.data?.sortOrder).toBe(10)
    expect(createResult.data?.isVisible).toBe(false)
    expect(createResult.data?.postCount).toBe(0)
    expect(createResult.data?.publishedPostCount).toBe(0)

    const categoryId = createResult.data?.id
    expect(categoryId).toBeTruthy()
    if (!categoryId) {
      throw new Error('缺少分类 ID')
    }
    createdCategoryIds.push(categoryId)

    const listResult = await authenticatedClient.api.category.get({
      query: {
        keyword: tempSuffix,
        isVisible: false,
      },
    })
    expect(listResult.status).toBe(200)
    expect(listResult.error).toBeNull()
    expect(listResult.data?.items.some((item) => item.id === categoryId)).toBe(true)

    const updateResult = await getCategoryClient(categoryId).patch({
      name: `Updated Engineering ${tempSuffix}`,
      description: null,
      sortOrder: 1,
      isVisible: true,
    })
    expect(updateResult.status).toBe(200)
    expect(updateResult.error).toBeNull()
    expect(updateResult.data?.id).toBe(categoryId)
    expect(updateResult.data?.description).toBeNull()
    expect(updateResult.data?.sortOrder).toBe(1)
    expect(updateResult.data?.isVisible).toBe(true)

    const writeOnlyRole = await createRoleWithPermissions(`category-write-${tempSuffix}`, [Permissions.POST.WRITE_ALL])
    await prisma.userRole.create({
      data: {
        userId: subjectUserId,
        roleId: writeOnlyRole.id,
        assignedBy: actorUserId,
      },
    })
    PermissionService.clearCache(subjectUserId)

    const writeOnlyListResult = await subjectClient.api.category.get({
      query: {
        keyword: tempSuffix,
      },
    })
    expect(writeOnlyListResult.status).toBe(200)
    expect(writeOnlyListResult.error).toBeNull()
    expect(writeOnlyListResult.data?.items.some((item) => item.id === categoryId)).toBe(true)

    const deleteResult = await getCategoryClient(categoryId).delete()
    expect(deleteResult.status).toBe(204)
    expect(deleteResult.error).toBeNull()

    const deletedDetailResult = await getCategoryClient(categoryId).get()
    expect(deletedDetailResult.status).toBe(404)
    expect(deletedDetailResult.error).toBeTruthy()

    const categoryIndex = createdCategoryIds.indexOf(categoryId)
    if (categoryIndex >= 0) {
      createdCategoryIds.splice(categoryIndex, 1)
    }
  })

  it('应支持文章创建、更新、发布、取消发布和删除', async () => {
    const slug = `eden-post-${tempSuffix}`
    const createdTitle = `Eden Post ${tempSuffix}`
    const markdown = `# Eden Post\n\ncontent ${tempSuffix}`
    const category = await prisma.category.create({
      data: {
        name: `Post Category ${tempSuffix}`,
        slug: `post-category-${tempSuffix}`,
        isVisible: true,
      },
    })
    createdCategoryIds.push(category.id)

    const createResult = await authenticatedClient.api.post.post({
      title: createdTitle,
      slug,
      markdown,
      excerpt: `  excerpt ${tempSuffix}  `,
      coverImage: 'https://example.com/cover.jpg',
      categoryId: category.id,
      tags: ['  bun  ', ' elysia '],
    })

    expect(createResult.status).toBe(200)
    expect(createResult.error).toBeNull()
    expect(createResult.data?.title).toBe(createdTitle)
    expect(createResult.data?.slug).toBe(slug)
    expect(createResult.data?.excerpt).toBe(`excerpt ${tempSuffix}`)
    expect(createResult.data?.categoryId).toBe(category.id)
    expect(createResult.data?.category).toEqual({
      id: category.id,
      name: `Post Category ${tempSuffix}`,
      slug: `post-category-${tempSuffix}`,
    })
    expect(createResult.data?.tags).toEqual(['bun', 'elysia'])
    expect(createResult.data?.status).toBe('draft')
    expect(createResult.data?.publishedAt).toBeNull()

    const postId = createResult.data?.id
    expect(postId).toBeTruthy()
    if (!postId) {
      throw new Error('缺少文章 ID')
    }
    createdPostIds.push(postId)

    const listResult = await authenticatedClient.api.post.get({
      query: {
        keyword: tempSuffix,
        status: 'draft',
        categoryId: category.id,
        tag: 'bun',
      },
    })

    expect(listResult.status).toBe(200)
    expect(listResult.error).toBeNull()
    expect(listResult.data?.items.some((item) => item.id === postId)).toBe(true)

    const detailResult = await getPostClient(postId).get()
    expect(detailResult.status).toBe(200)
    expect(detailResult.error).toBeNull()
    expect(detailResult.data?.id).toBe(postId)

    const updatedSlug = `eden-post-updated-${tempSuffix}`
    const updateResult = await getPostClient(postId).patch({
      title: `Updated Eden Post ${tempSuffix}`,
      slug: updatedSlug,
      excerpt: null,
      coverImage: null,
      categoryId: null,
      tags: ['updated'],
    })
    expect(updateResult.status).toBe(200)
    expect(updateResult.error).toBeNull()
    expect(updateResult.data?.id).toBe(postId)
    expect(updateResult.data?.title).toBe(`Updated Eden Post ${tempSuffix}`)
    expect(updateResult.data?.slug).toBe(updatedSlug)
    expect(updateResult.data?.excerpt).toBeNull()
    expect(updateResult.data?.coverImage).toBeNull()
    expect(updateResult.data?.categoryId).toBeNull()
    expect(updateResult.data?.category).toBeNull()
    expect(updateResult.data?.tags).toEqual(['updated'])

    const publishResult = await getPostClient(postId).publish.post()
    expect(publishResult.status).toBe(200)
    expect(publishResult.error).toBeNull()
    expect(publishResult.data?.status).toBe('published')
    expectValidDateTime(publishResult.data?.publishedAt)

    const publicDetailResult = await publicSiteClient.posts({ slug: updatedSlug }).get()
    expect(publicDetailResult.status).toBe(200)
    expect(publicDetailResult.error).toBeNull()
    expect(publicDetailResult.data?.id).toBe(postId)

    const unpublishResult = await getPostClient(postId).unpublish.post()
    expect(unpublishResult.status).toBe(200)
    expect(unpublishResult.error).toBeNull()
    expect(unpublishResult.data?.status).toBe('draft')
    expect(unpublishResult.data?.publishedAt).toBeNull()

    const deleteResult = await getPostClient(postId).delete()
    expect(deleteResult.status).toBe(204)
    expect(deleteResult.error).toBeNull()

    const deletedDetailResult = await getPostClient(postId).get()
    expect(deletedDetailResult.status).toBe(404)
    expect(deletedDetailResult.error).toBeTruthy()
  })

  it('文章列表关键字搜索不应匹配 markdown 内容', async () => {
    const hiddenKeyword = `hidden-markdown-${tempSuffix}`
    const createResult = await authenticatedClient.api.post.post({
      title: `Keyword Filter ${tempSuffix}`,
      slug: `eden-post-keyword-${tempSuffix}`,
      markdown: `# ${hiddenKeyword}`,
      excerpt: 'visible excerpt',
      tags: ['keyword'],
    })

    expect(createResult.status).toBe(200)
    expect(createResult.error).toBeNull()

    const postId = createResult.data?.id
    expect(postId).toBeTruthy()
    if (!postId) {
      throw new Error('缺少关键字文章 ID')
    }
    createdPostIds.push(postId)

    const listResult = await authenticatedClient.api.post.get({
      query: {
        keyword: hiddenKeyword,
      },
    })

    expect(listResult.status).toBe(200)
    expect(listResult.error).toBeNull()
    expect(listResult.data?.items.some((item) => item.id === postId)).toBe(false)
  })

  it('匿名用户通过个人站点接口只能读取可展示内容', async () => {
    const publicSlug = `eden-post-public-${tempSuffix}`
    const draftSlug = `eden-post-public-draft-${tempSuffix}`
    const hiddenCategorySlug = `hidden-category-${tempSuffix}`
    const [category, hiddenCategory] = await Promise.all([
      prisma.category.create({
        data: {
          name: `Public Category ${tempSuffix}`,
          slug: `public-category-${tempSuffix}`,
          isVisible: true,
        },
      }),
      prisma.category.create({
        data: {
          name: `Hidden Category ${tempSuffix}`,
          slug: hiddenCategorySlug,
          isVisible: false,
        },
      }),
    ])
    createdCategoryIds.push(category.id, hiddenCategory.id)

    const [publishedPost, draftPost, hiddenCategoryPost] = await Promise.all([
      prisma.post.create({
        data: {
          title: `Public Post ${tempSuffix}`,
          slug: publicSlug,
          markdown: `# Public Post ${tempSuffix}`,
          excerpt: `public excerpt ${tempSuffix}`,
          categoryId: category.id,
          tags: ['public'],
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      }),
      prisma.post.create({
        data: {
          title: `Draft Post ${tempSuffix}`,
          slug: draftSlug,
          markdown: `# Draft Post ${tempSuffix}`,
          excerpt: `draft excerpt ${tempSuffix}`,
          categoryId: category.id,
          tags: ['public'],
          status: 'DRAFT',
        },
      }),
      prisma.post.create({
        data: {
          title: `Hidden Category Post ${tempSuffix}`,
          slug: `hidden-category-post-${tempSuffix}`,
          markdown: `# Hidden Category Post ${tempSuffix}`,
          excerpt: `hidden category excerpt ${tempSuffix}`,
          categoryId: hiddenCategory.id,
          tags: ['public'],
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      }),
    ])
    createdPostIds.push(publishedPost.id, draftPost.id, hiddenCategoryPost.id)

    const categoryListResult = await publicSiteClient.categories.get({
      query: {
        keyword: tempSuffix,
      },
    })
    expect(categoryListResult.status).toBe(200)
    expect(categoryListResult.error).toBeNull()
    expect(categoryListResult.data?.some((item) => item.id === category.id && item.postCount === 1)).toBe(true)
    expect(categoryListResult.data?.some((item) => item.id === hiddenCategory.id)).toBe(false)

    const listResult = await publicSiteClient.posts.get({
      query: {
        page: 1,
        pageSize: 10,
        keyword: tempSuffix,
        categorySlug: category.slug,
        tag: 'public',
      },
    })

    expect(listResult.status).toBe(200)
    expect(listResult.error).toBeNull()
    expect(listResult.data?.items.some((item) => item.id === publishedPost.id)).toBe(true)
    expect(listResult.data?.items.some((item) => item.id === draftPost.id)).toBe(false)
    expect(listResult.data?.items.some((item) => item.id === hiddenCategoryPost.id)).toBe(false)
    expect(listResult.data?.items[0]).not.toHaveProperty('markdown')

    const categoryPostsResult = await publicSiteClient.categories({ slug: category.slug }).posts.get({
      query: {
        page: 1,
        pageSize: 10,
        tag: 'public',
      },
    })
    expect(categoryPostsResult.status).toBe(200)
    expect(categoryPostsResult.error).toBeNull()
    expect(categoryPostsResult.data?.items.some((item) => item.id === publishedPost.id)).toBe(true)

    const hiddenCategoryPostsResult = await publicSiteClient.categories({ slug: hiddenCategorySlug }).posts.get()
    expect(hiddenCategoryPostsResult.status).toBe(404)
    expect(hiddenCategoryPostsResult.error).toBeTruthy()

    const detailResult = await publicSiteClient.posts({ slug: publicSlug }).get()
    expect(detailResult.status).toBe(200)
    expect(detailResult.error).toBeNull()
    expect(detailResult.data?.id).toBe(publishedPost.id)
    expect(detailResult.data?.markdown).toBe(`# Public Post ${tempSuffix}`)
    expect(detailResult.data?.category).toEqual({
      id: category.id,
      name: `Public Category ${tempSuffix}`,
      slug: `public-category-${tempSuffix}`,
    })

    const draftDetailResult = await publicSiteClient.posts({ slug: draftSlug }).get()
    expect(draftDetailResult.status).toBe(404)
    expect(draftDetailResult.error).toBeTruthy()

    const hiddenCategoryDetailResult = await publicSiteClient
      .posts({ slug: `hidden-category-post-${tempSuffix}` })
      .get()
    expect(hiddenCategoryDetailResult.status).toBe(404)
    expect(hiddenCategoryDetailResult.error).toBeTruthy()
  })

  it('slug 重复时应返回 409', async () => {
    const slug = `eden-post-duplicate-${tempSuffix}`

    const firstResult = await authenticatedClient.api.post.post({
      title: `First ${tempSuffix}`,
      slug,
      markdown: `# First ${tempSuffix}`,
      tags: [],
    })

    expect(firstResult.status).toBe(200)
    expect(firstResult.error).toBeNull()

    const firstPostId = firstResult.data?.id
    expect(firstPostId).toBeTruthy()
    if (!firstPostId) {
      throw new Error('缺少首篇文章 ID')
    }
    createdPostIds.push(firstPostId)

    const duplicateResult = await authenticatedClient.api.post.post({
      title: `Second ${tempSuffix}`,
      slug,
      markdown: `# Second ${tempSuffix}`,
      tags: [],
    })

    expect(duplicateResult.status).toBe(409)
    expect(duplicateResult.error).toBeTruthy()
  })

  it('文章更新为空对象或标签过长时应返回 422', async () => {
    const createResult = await authenticatedClient.api.post.post({
      title: `Validation ${tempSuffix}`,
      slug: `eden-post-validation-${tempSuffix}`,
      markdown: `# Validation ${tempSuffix}`,
      tags: ['valid-tag'],
    })

    expect(createResult.status).toBe(200)
    expect(createResult.error).toBeNull()

    const postId = createResult.data?.id
    expect(postId).toBeTruthy()
    if (!postId) {
      throw new Error('缺少校验文章 ID')
    }
    createdPostIds.push(postId)

    const emptyUpdateResult = await getPostClient(postId).patch({})
    expect(emptyUpdateResult.status).toBe(422)
    expect(emptyUpdateResult.error).toBeTruthy()

    const invalidTagResult = await authenticatedClient.api.post.post({
      title: `Invalid Tag ${tempSuffix}`,
      slug: `eden-post-invalid-tag-${tempSuffix}`,
      markdown: `# Invalid Tag ${tempSuffix}`,
      tags: ['a'.repeat(31)],
    })

    expect(invalidTagResult.status).toBe(422)
    expect(invalidTagResult.error).toBeTruthy()
  })

  it('无发布权限用户发布或取消发布文章应返回 403', async () => {
    const createResult = await authenticatedClient.api.post.post({
      title: `Publish Forbidden ${tempSuffix}`,
      slug: `eden-post-publish-forbidden-${tempSuffix}`,
      markdown: `# Publish Forbidden ${tempSuffix}`,
      tags: [],
    })

    expect(createResult.status).toBe(200)
    expect(createResult.error).toBeNull()

    const postId = createResult.data?.id
    expect(postId).toBeTruthy()
    if (!postId) {
      throw new Error('缺少发布权限测试文章 ID')
    }
    createdPostIds.push(postId)

    const subjectPostClient = getSubjectPostClient(postId)

    const publishResult = await subjectPostClient.publish.post()
    expect(publishResult.status).toBe(403)
    expect(publishResult.error).toBeTruthy()

    const unpublishResult = await subjectPostClient.unpublish.post()
    expect(unpublishResult.status).toBe(403)
    expect(unpublishResult.error).toBeTruthy()
  })

  it('匿名用户不可访问后台文章和分类接口', async () => {
    const postListResult = await anonymousClient.api.post.get()
    expect(postListResult.status).toBe(401)
    expect(postListResult.error).toBeTruthy()

    const categoryListResult = await anonymousClient.api.category.get()
    expect(categoryListResult.status).toBe(401)
    expect(categoryListResult.error).toBeTruthy()
  })

  it('匿名用户可给已发布文章创建 pending 评论', async () => {
    const publishedPost = await createCommentTargetPost('PUBLISHED', 'comment-target')
    const { result: createResult } = await createPendingComment(publishedPost.id, 'First')

    expect(createResult.status).toBe(200)
    expect(createResult.error).toBeNull()
    expect(createResult.data?.postId).toBe(publishedPost.id)
    expect(createResult.data?.status).toBe('pending')
  })

  it('草稿文章不可创建评论', async () => {
    const draftPost = await createCommentTargetPost('DRAFT', 'comment-draft-target')

    const draftCreateResult = await anonymousClient.api.comment.post({
      postId: draftPost.id,
      authorName: 'Alice',
      content: `Draft ${tempSuffix}`,
    })
    expect(draftCreateResult.status).toBe(404)
    expect(draftCreateResult.error).toBeTruthy()
  })

  it('评论创建参数非法时应返回 422', async () => {
    const publishedPost = await createCommentTargetPost('PUBLISHED', 'comment-validation-target')

    const invalidEmailResult = await anonymousClient.api.comment.post({
      postId: publishedPost.id,
      authorName: 'Alice',
      authorEmail: 'invalid-email',
      content: `Invalid Email ${tempSuffix}`,
    })
    expect(invalidEmailResult.status).toBe(422)
    expect(invalidEmailResult.error).toBeTruthy()

    const emptyContentResult = await anonymousClient.api.comment.post({
      postId: publishedPost.id,
      authorName: 'Alice',
      content: '   ',
    })
    expect(emptyContentResult.status).toBe(422)
    expect(emptyContentResult.error).toBeTruthy()
  })

  it('匿名用户不可读评论列表', async () => {
    const anonymousListResult = await anonymousClient.api.comment.get()
    expect(anonymousListResult.status).toBe(401)
    expect(anonymousListResult.error).toBeTruthy()
  })

  it('管理员可读取评论列表和详情', async () => {
    const publishedPost = await createCommentTargetPost('PUBLISHED', 'comment-list-target')
    const { commentId } = await createPendingComment(publishedPost.id, 'List')

    const listResult = await authenticatedClient.api.comment.get({
      query: {
        postId: publishedPost.id,
        status: 'pending',
        keyword: tempSuffix,
      },
    })
    expect(listResult.status).toBe(200)
    expect(listResult.error).toBeNull()
    expect(listResult.data?.items.some((item) => item.id === commentId)).toBe(true)

    const detailResult = await getCommentClient(commentId).get()
    expect(detailResult.status).toBe(200)
    expect(detailResult.error).toBeNull()
    expect(detailResult.data?.id).toBe(commentId)
    expect(detailResult.data?.status).toBe('pending')
  })

  it('评论列表应支持创建时间范围过滤并校验时间顺序', async () => {
    const publishedPost = await createCommentTargetPost('PUBLISHED', 'comment-date-target')
    const createdFrom = new Date(Date.now() - 1000).toISOString()
    const { commentId } = await createPendingComment(publishedPost.id, 'Date Range')
    const createdTo = new Date(Date.now() + 1000).toISOString()

    const matchedResult = await authenticatedClient.api.comment.get({
      query: {
        postId: publishedPost.id,
        keyword: tempSuffix,
        createdFrom,
        createdTo,
      },
    })
    expect(matchedResult.status).toBe(200)
    expect(matchedResult.error).toBeNull()
    expect(matchedResult.data?.items.some((item) => item.id === commentId)).toBe(true)

    const futureResult = await authenticatedClient.api.comment.get({
      query: {
        postId: publishedPost.id,
        keyword: tempSuffix,
        createdFrom: new Date(Date.now() + 60_000).toISOString(),
      },
    })
    expect(futureResult.status).toBe(200)
    expect(futureResult.error).toBeNull()
    expect(futureResult.data?.items.some((item) => item.id === commentId)).toBe(false)

    const invalidRangeResult = await authenticatedClient.api.comment.get({
      query: {
        createdFrom: new Date(Date.now() + 60_000).toISOString(),
        createdTo: new Date(Date.now() - 60_000).toISOString(),
      },
    })
    expect(invalidRangeResult.status).toBe(422)
    expect(invalidRangeResult.error).toBeTruthy()
  })

  it('无权限用户访问评论管理接口返回 403', async () => {
    const publishedPost = await createCommentTargetPost('PUBLISHED', 'comment-forbidden-target')
    const { commentId } = await createPendingComment(publishedPost.id, 'Forbidden')

    const forbiddenListResult = await subjectClient.api.comment.get()
    expect(forbiddenListResult.status).toBe(403)
    expect(forbiddenListResult.error).toBeTruthy()

    const forbiddenStatusResult = await subjectClient.api.comment({ id: commentId }).status.patch({
      status: 'approved',
    })
    expect(forbiddenStatusResult.status).toBe(403)
    expect(forbiddenStatusResult.error).toBeTruthy()
  })

  it('管理员可更新评论状态并删除评论', async () => {
    const publishedPost = await createCommentTargetPost('PUBLISHED', 'comment-delete-target')
    const { commentId } = await createPendingComment(publishedPost.id, 'Delete')

    const statusResult = await getCommentClient(commentId).status.patch({
      status: 'approved',
    })
    expect(statusResult.status).toBe(200)
    expect(statusResult.error).toBeNull()
    expect(statusResult.data?.status).toBe('approved')

    const deleteResult = await getCommentClient(commentId).delete()
    expect(deleteResult.status).toBe(204)
    expect(deleteResult.error).toBeNull()

    const deletedComment = await prisma.comment.findUnique({
      where: { id: commentId },
    })
    expect(deletedComment?.status).toBe('DELETED')
  })

  it('已删除评论不能再修改状态', async () => {
    const publishedPost = await createCommentTargetPost('PUBLISHED', 'comment-deleted-status-target')
    const { commentId } = await createPendingComment(publishedPost.id, 'Deleted Status')

    const deleteResult = await getCommentClient(commentId).delete()
    expect(deleteResult.status).toBe(204)
    expect(deleteResult.error).toBeNull()

    const statusResult = await getCommentClient(commentId).status.patch({
      status: 'approved',
    })
    expect(statusResult.status).toBe(400)
    expect(statusResult.error).toBeTruthy()
  })

  it('默认评论列表不返回 deleted', async () => {
    const publishedPost = await createCommentTargetPost('PUBLISHED', 'comment-default-list-target')
    const { commentId } = await createPendingComment(publishedPost.id, 'Default List')

    const deleteResult = await getCommentClient(commentId).delete()
    expect(deleteResult.status).toBe(204)
    expect(deleteResult.error).toBeNull()

    const defaultListAfterDeleteResult = await authenticatedClient.api.comment.get({
      query: {
        postId: publishedPost.id,
        keyword: tempSuffix,
      },
    })
    expect(defaultListAfterDeleteResult.status).toBe(200)
    expect(defaultListAfterDeleteResult.data?.items.some((item) => item.id === commentId)).toBe(false)
  })

  it('显式传 status=deleted 能查到 deleted 评论', async () => {
    const publishedPost = await createCommentTargetPost('PUBLISHED', 'comment-deleted-list-target')
    const { commentId } = await createPendingComment(publishedPost.id, 'Deleted List')

    const deleteResult = await getCommentClient(commentId).delete()
    expect(deleteResult.status).toBe(204)
    expect(deleteResult.error).toBeNull()

    const deletedListResult = await authenticatedClient.api.comment.get({
      query: {
        postId: publishedPost.id,
        status: 'deleted',
        keyword: tempSuffix,
      },
    })
    expect(deletedListResult.status).toBe(200)
    expect(deletedListResult.data?.items.some((item) => item.id === commentId)).toBe(true)
  })

  it('应支持 media 上传、列表、文件访问和删除', async () => {
    const anonymousListResult = await anonymousClient.api.media.get()
    expect(anonymousListResult.status).toBe(401)
    expect(anonymousListResult.error).toBeTruthy()

    const uploadResult = await authenticatedClient.api.media.upload.post({
      file: new File([`media-smoke-${tempSuffix}`], `eden-media-${tempSuffix}.png`, {
        type: 'image/png',
      }),
    })
    expect(uploadResult.status).toBe(200)
    expect(uploadResult.error).toBeNull()
    expect(uploadResult.data?.originalName).toBe(`eden-media-${tempSuffix}.png`)
    expect(uploadResult.data?.mimeType).toContain('image/png')
    expect(uploadResult.data?.size).toBeGreaterThan(0)

    const mediaId = uploadResult.data?.id
    expect(mediaId).toBeTruthy()
    if (!mediaId) {
      throw new Error('缺少媒体 ID')
    }
    createdMediaIds.push(mediaId)

    const listResult = await authenticatedClient.api.media.get()
    expect(listResult.status).toBe(200)
    expect(listResult.error).toBeNull()
    expect(listResult.data?.items.some((item) => item.id === mediaId)).toBe(true)

    const detailResult = await getMediaClient(mediaId).get()
    expect(detailResult.status).toBe(200)
    expect(detailResult.error).toBeNull()
    expect(detailResult.data?.id).toBe(mediaId)

    const fileResponse = await authenticatedCookieSession.fetcher(`${baseUrl}/api/media/${mediaId}/file`)
    expect(fileResponse.status).toBe(200)
    expect(await fileResponse.text()).toBe(`media-smoke-${tempSuffix}`)
    expect(fileResponse.headers.get('content-type')).toContain('image/png')

    const forbiddenListResult = await subjectClient.api.media.get()
    expect(forbiddenListResult.status).toBe(403)
    expect(forbiddenListResult.error).toBeTruthy()

    const forbiddenDeleteResult = await subjectClient.api.media({ id: mediaId }).delete()
    expect(forbiddenDeleteResult.status).toBe(403)
    expect(forbiddenDeleteResult.error).toBeTruthy()

    const deleteResult = await getMediaClient(mediaId).delete()
    expect(deleteResult.status).toBe(204)
    expect(deleteResult.error).toBeNull()

    await prisma.media.deleteMany({
      where: {
        id: mediaId,
      },
    })
    const mediaIndex = createdMediaIds.indexOf(mediaId)
    if (mediaIndex >= 0) {
      createdMediaIds.splice(mediaIndex, 1)
    }
  })

  it('媒体上传非图片文件应返回 400', async () => {
    const uploadResult = await authenticatedClient.api.media.upload.post({
      file: new File([`not-image-${tempSuffix}`], `eden-media-${tempSuffix}.txt`, {
        type: 'text/plain',
      }),
    })

    expect(uploadResult.status).toBe(400)
    expect(uploadResult.error).toBeTruthy()
  })

  it('应支持 Markdown 预览', async () => {
    const result = await authenticatedClient.api.preview.markdown.post({
      type: 'post',
      markdown: '# Title\n\nFirst paragraph for preview excerpt.',
    })

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data?.html).toContain('<h1 id="title">Title</h1>')
    expect(result.data?.toc[0]?.text).toBe('Title')
    expect(result.data?.toc[0]?.slug).toBe('title')
    expect(result.data?.excerpt).toBe('First paragraph for preview excerpt.')
  })

  it('重复标题时应稳定生成可锚定的 slug', async () => {
    const result = await authenticatedClient.api.preview.markdown.post({
      type: 'post',
      markdown: '# Title\n\n## Title\n\n### Title',
    })

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data?.toc.map((item) => item.slug)).toEqual(['title', 'title-2', 'title-3'])
    expect(result.data?.html).toContain('<h1 id="title">Title</h1>')
    expect(result.data?.html).toContain('<h2 id="title-2">Title</h2>')
    expect(result.data?.html).toContain('<h3 id="title-3">Title</h3>')
  })

  it('显式传入 excerpt 时应优先使用传入值', async () => {
    const result = await authenticatedClient.api.preview.markdown.post({
      type: 'post',
      markdown: '# Title\n\nFirst paragraph for preview excerpt.',
      excerpt: 'Custom excerpt',
    })

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data?.excerpt).toBe('Custom excerpt')
  })

  it('具备 POST 写权限的用户应可访问文章预览', async () => {
    const postPreviewRole = await createRoleWithPermissions(`post-preview-${tempSuffix}`, [Permissions.POST.WRITE_ALL])

    await prisma.userRole.create({
      data: {
        userId: subjectUserId,
        roleId: postPreviewRole.id,
        assignedBy: actorUserId,
      },
    })
    PermissionService.clearCache(subjectUserId)

    const postPreviewResult = await subjectClient.api.preview.markdown.post({
      type: 'post',
      markdown: '# Post Title\n\nPost preview paragraph.',
    })

    expect(postPreviewResult.status).toBe(200)
    expect(postPreviewResult.error).toBeNull()
    expect(postPreviewResult.data?.html).toContain('<h1 id="post-title">Post Title</h1>')
  })
})
