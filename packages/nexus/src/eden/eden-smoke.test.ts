import type { SiteConfigRecord } from '../modules/site-config/repository'
import type { App } from '../public/eden'

import { treaty } from '@elysiajs/eden'
import { Prisma } from '@nexus/infra/database/prisma/generated/client'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createApp } from '../app'
import { AUTH_CONFIG } from '../core/config'
import { parsePermission, Permissions, PermissionService, SYSTEM_PERMISSION_DEFINITIONS } from '../core/security'
import { betterAuthInstance } from '../core/security/auth'
import { prisma } from '../infra/database'
import { SiteConfigRepository } from '../modules/site-config/repository'

const app = createApp()
const baseUrl = 'http://localhost'
const authBaseUrl = 'http://localhost:7788'
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

const authenticatedClient = treaty<App>(baseUrl, {
  fetcher: authenticatedCookieSession.fetcher,
})

const subjectClient = treaty<App>(baseUrl, {
  fetcher: subjectCookieSession.fetcher,
})

function getPostClient(postId: string): ReturnType<typeof authenticatedClient.api.post> {
  return (authenticatedClient.api.post as unknown as Record<string, ReturnType<typeof authenticatedClient.api.post>>)[
    postId
  ]
}

function getPageClient(pageId: string): ReturnType<typeof authenticatedClient.api.page> {
  return (authenticatedClient.api.page as unknown as Record<string, ReturnType<typeof authenticatedClient.api.page>>)[
    pageId
  ]
}

function getSubjectPageClient(pageId: string): ReturnType<typeof subjectClient.api.page> {
  return (subjectClient.api.page as unknown as Record<string, ReturnType<typeof subjectClient.api.page>>)[pageId]
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
const createdPageIds: string[] = []
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
let originalSiteConfigRecord: SiteConfigRecord | null = null
let actorUserId = ''
let subjectUserId = ''
let superAdminRoleId = ''
let adminRoleId = ''
let userRoleId = ''
const originalEmailPasswordEnabled = AUTH_CONFIG.methods.emailPassword.enabled
const originalEmailPasswordAllowSignUp = AUTH_CONFIG.methods.emailPassword.allowSignUp
const originalBetterAuthEmailPasswordEnabled = betterAuthInstance.options.emailAndPassword.enabled

beforeAll(async () => {
  AUTH_CONFIG.methods.emailPassword.enabled = true
  AUTH_CONFIG.methods.emailPassword.allowSignUp = true
  betterAuthInstance.options.emailAndPassword.enabled = true
  originalSiteConfigRecord = await SiteConfigRepository.findDefault()

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
  AUTH_CONFIG.methods.emailPassword.enabled = originalEmailPasswordEnabled
  AUTH_CONFIG.methods.emailPassword.allowSignUp = originalEmailPasswordAllowSignUp
  betterAuthInstance.options.emailAndPassword.enabled = originalBetterAuthEmailPasswordEnabled

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

  if (createdPageIds.length > 0) {
    await prisma.page.deleteMany({
      where: {
        id: {
          in: createdPageIds,
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
      },
      {
        id: 'github',
        kind: 'oauth',
        enabled: AUTH_CONFIG.methods.github.enabled,
        allowSignUp: AUTH_CONFIG.methods.github.allowSignUp,
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

  it('应拒绝未登录访问页面列表', async () => {
    const result = await anonymousClient.api.page.get()

    expect(result.status).toBe(401)
    expect(result.error).toBeTruthy()
  })

  it('应支持读取默认站点配置并在缺少记录时自动初始化', async () => {
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

  it('已登录但没有 PAGE 权限时应返回 403', async () => {
    const listResult = await subjectClient.api.page.get()
    expect(listResult.status).toBe(403)
    expect(listResult.error).toBeTruthy()

    const createResult = await subjectClient.api.page.post({
      title: `Forbidden Page ${tempSuffix}`,
      slug: `eden-page-forbidden-${tempSuffix}`,
      markdown: `# Forbidden Page ${tempSuffix}`,
      showInNavigation: false,
      sortOrder: 0,
    })
    expect(createResult.status).toBe(403)
    expect(createResult.error).toBeTruthy()

    const publishTargetResult = await authenticatedClient.api.page.post({
      title: `Publish Target ${tempSuffix}`,
      slug: `eden-page-publish-target-${tempSuffix}`,
      markdown: `# Publish Target ${tempSuffix}`,
      showInNavigation: false,
      sortOrder: 0,
    })
    expect(publishTargetResult.status).toBe(200)
    expect(publishTargetResult.error).toBeNull()

    const pageId = publishTargetResult.data?.id
    expect(pageId).toBeTruthy()
    if (!pageId) {
      throw new Error('缺少待发布页面 ID')
    }
    createdPageIds.push(pageId)

    const publishResult = await getSubjectPageClient(pageId).publish.post()
    expect(publishResult.status).toBe(403)
    expect(publishResult.error).toBeTruthy()
  })

  it('应支持页面创建、发布、更新导航设置和删除', async () => {
    const slug = `eden-page-${tempSuffix}`
    const createdTitle = `Eden Page ${tempSuffix}`
    const markdown = `# Eden Page\n\ncontent ${tempSuffix}`
    const createResult = await authenticatedClient.api.page.post({
      title: createdTitle,
      slug,
      markdown,
      excerpt: `  excerpt ${tempSuffix}  `,
      coverImage: 'https://example.com/page-cover.jpg',
      showInNavigation: false,
      sortOrder: 0,
    })

    expect(createResult.status).toBe(200)
    expect(createResult.error).toBeNull()
    expect(createResult.data?.title).toBe(createdTitle)
    expect(createResult.data?.slug).toBe(slug)
    expect(createResult.data?.excerpt).toBe(`excerpt ${tempSuffix}`)
    expect(createResult.data?.status).toBe('draft')
    expect(createResult.data?.showInNavigation).toBe(false)
    expect(createResult.data?.sortOrder).toBe(0)
    expect(createResult.data?.publishedAt).toBeNull()

    const pageId = createResult.data?.id
    expect(pageId).toBeTruthy()
    if (!pageId) {
      throw new Error('缺少页面 ID')
    }
    createdPageIds.push(pageId)

    const listResult = await authenticatedClient.api.page.get({
      query: {
        keyword: tempSuffix,
        status: 'draft',
        showInNavigation: false,
      },
    })

    expect(listResult.status).toBe(200)
    expect(listResult.error).toBeNull()
    expect(listResult.data?.items.some((item) => item.id === pageId)).toBe(true)
    const listedPage = listResult.data?.items.find((item) => item.id === pageId)
    expect(listedPage).toBeTruthy()
    expect(listedPage ? 'markdown' in listedPage : false).toBe(false)

    const detailResult = await getPageClient(pageId).get()
    expect(detailResult.status).toBe(200)
    expect(detailResult.error).toBeNull()
    expect(detailResult.data?.id).toBe(pageId)

    const invalidNavigationResult = await getPageClient(pageId).patch({
      showInNavigation: true,
    })
    expect(invalidNavigationResult.status).toBe(400)
    expect(invalidNavigationResult.error).toBeTruthy()
    expect(invalidNavigationResult.error?.value.message).toBe('只有已发布页面才能显示在导航中')

    const publishResult = await getPageClient(pageId).publish.post()
    expect(publishResult.status).toBe(200)
    expect(publishResult.error).toBeNull()
    expect(publishResult.data?.status).toBe('published')
    expect(publishResult.data?.publishedAt).toBeTruthy()

    const firstPublishedAt = publishResult.data?.publishedAt
    expect(firstPublishedAt).toBeTruthy()

    const republishResult = await getPageClient(pageId).publish.post()
    expect(republishResult.status).toBe(200)
    expect(republishResult.error).toBeNull()
    expect(republishResult.data?.status).toBe('published')
    expect(republishResult.data?.publishedAt).toEqual(firstPublishedAt)

    const updateResult = await getPageClient(pageId).patch({
      title: `  Eden Page Updated ${tempSuffix}  `,
      markdown: `  # Eden Page Updated\n\ncontent ${tempSuffix}  `,
      showInNavigation: true,
      sortOrder: 12,
    })
    expect(updateResult.status).toBe(200)
    expect(updateResult.error).toBeNull()
    expect(updateResult.data?.title).toBe(`Eden Page Updated ${tempSuffix}`)
    expect(updateResult.data?.markdown).toBe(`# Eden Page Updated\n\ncontent ${tempSuffix}`)
    expect(updateResult.data?.showInNavigation).toBe(true)
    expect(updateResult.data?.sortOrder).toBe(12)

    const refreshedDetailResult = await getPageClient(pageId).get()
    expect(refreshedDetailResult.status).toBe(200)
    expect(refreshedDetailResult.error).toBeNull()
    expect(refreshedDetailResult.data?.showInNavigation).toBe(true)
    expect(refreshedDetailResult.data?.sortOrder).toBe(12)

    const unpublishResult = await getPageClient(pageId).unpublish.post()
    expect(unpublishResult.status).toBe(200)
    expect(unpublishResult.error).toBeNull()
    expect(unpublishResult.data?.status).toBe('draft')
    expect(unpublishResult.data?.showInNavigation).toBe(false)
    expect(unpublishResult.data?.publishedAt).toBeNull()

    const deleteResult = await getPageClient(pageId).delete()
    expect(deleteResult.status).toBe(204)
    expect(deleteResult.error).toBeNull()

    await prisma.page.deleteMany({
      where: {
        id: pageId,
      },
    })
    const pageIndex = createdPageIds.indexOf(pageId)
    if (pageIndex >= 0) {
      createdPageIds.splice(pageIndex, 1)
    }
  })

  it('页面列表关键字搜索不应匹配 markdown 内容', async () => {
    const hiddenKeyword = `hidden-page-markdown-${tempSuffix}`
    const createResult = await authenticatedClient.api.page.post({
      title: `Page Keyword Filter ${tempSuffix}`,
      slug: `eden-page-keyword-${tempSuffix}`,
      markdown: `# ${hiddenKeyword}`,
      excerpt: 'visible excerpt',
      showInNavigation: false,
      sortOrder: 0,
    })

    expect(createResult.status).toBe(200)
    expect(createResult.error).toBeNull()

    const pageId = createResult.data?.id
    expect(pageId).toBeTruthy()
    if (!pageId) {
      throw new Error('缺少关键字页面 ID')
    }
    createdPageIds.push(pageId)

    const listResult = await authenticatedClient.api.page.get({
      query: {
        keyword: hiddenKeyword,
      },
    })

    expect(listResult.status).toBe(200)
    expect(listResult.error).toBeNull()
    expect(listResult.data?.items.some((item) => item.id === pageId)).toBe(false)
  })

  it('页面 slug 重复时应返回 409', async () => {
    const slug = `eden-page-duplicate-${tempSuffix}`

    const firstResult = await authenticatedClient.api.page.post({
      title: `First Page ${tempSuffix}`,
      slug,
      markdown: `# First Page ${tempSuffix}`,
      showInNavigation: false,
      sortOrder: 0,
    })

    expect(firstResult.status).toBe(200)
    expect(firstResult.error).toBeNull()

    const firstPageId = firstResult.data?.id
    expect(firstPageId).toBeTruthy()
    if (!firstPageId) {
      throw new Error('缺少首个页面 ID')
    }
    createdPageIds.push(firstPageId)

    const duplicateResult = await authenticatedClient.api.page.post({
      title: `Second Page ${tempSuffix}`,
      slug,
      markdown: `# Second Page ${tempSuffix}`,
      showInNavigation: false,
      sortOrder: 0,
    })

    expect(duplicateResult.status).toBe(409)
    expect(duplicateResult.error).toBeTruthy()
  })

  it('应支持文章创建、更新、发布、取消发布和删除', async () => {
    const slug = `eden-post-${tempSuffix}`
    const createdTitle = `Eden Post ${tempSuffix}`
    const markdown = `# Eden Post\n\ncontent ${tempSuffix}`
    const createResult = await authenticatedClient.api.post.post({
      title: createdTitle,
      slug,
      markdown,
      excerpt: `  excerpt ${tempSuffix}  `,
      coverImage: 'https://example.com/cover.jpg',
      category: '  engineering  ',
      tags: ['  bun  ', ' elysia '],
    })

    expect(createResult.status).toBe(200)
    expect(createResult.error).toBeNull()
    expect(createResult.data?.title).toBe(createdTitle)
    expect(createResult.data?.slug).toBe(slug)
    expect(createResult.data?.excerpt).toBe(`excerpt ${tempSuffix}`)
    expect(createResult.data?.category).toBe('engineering')
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
        category: 'engineering',
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

    const updatedTitle = `Eden Post Updated ${tempSuffix}`
    const updatedMarkdown = `# Eden Updated Post\n\ncontent ${tempSuffix}`
    const updateResult = await getPostClient(postId).patch({
      title: `  ${updatedTitle}  `,
      markdown: `  ${updatedMarkdown}  `,
      excerpt: `  updated excerpt ${tempSuffix}  `,
      category: '  platform  ',
      tags: ['  release  ', ' smoke '],
    })
    expect(updateResult.status).toBe(200)
    expect(updateResult.error).toBeNull()
    expect(updateResult.data?.title).toBe(updatedTitle)
    expect(updateResult.data?.markdown).toBe(updatedMarkdown)
    expect(updateResult.data?.excerpt).toBe(`updated excerpt ${tempSuffix}`)
    expect(updateResult.data?.category).toBe('platform')
    expect(updateResult.data?.tags).toEqual(['release', 'smoke'])

    const refreshedDetailResult = await getPostClient(postId).get()
    expect(refreshedDetailResult.status).toBe(200)
    expect(refreshedDetailResult.error).toBeNull()
    expect(refreshedDetailResult.data?.title).toBe(updatedTitle)
    expect(refreshedDetailResult.data?.markdown).toBe(updatedMarkdown)

    const publishResult = await getPostClient(postId).publish.post()
    expect(publishResult.status).toBe(200)
    expect(publishResult.error).toBeNull()
    expect(publishResult.data?.status).toBe('published')
    expect(publishResult.data?.publishedAt).toBeTruthy()

    const firstPublishedAt = publishResult.data?.publishedAt
    expect(firstPublishedAt).toBeTruthy()

    const republishResult = await getPostClient(postId).publish.post()
    expect(republishResult.status).toBe(200)
    expect(republishResult.error).toBeNull()
    expect(republishResult.data?.status).toBe('published')
    expect(republishResult.data?.publishedAt).toEqual(firstPublishedAt)

    const unpublishResult = await getPostClient(postId).unpublish.post()
    expect(unpublishResult.status).toBe(200)
    expect(unpublishResult.error).toBeNull()
    expect(unpublishResult.data?.status).toBe('draft')
    expect(unpublishResult.data?.publishedAt).toBeNull()

    const deleteResult = await getPostClient(postId).delete()
    expect(deleteResult.status).toBe(204)
    expect(deleteResult.error).toBeNull()

    await prisma.post.deleteMany({
      where: {
        id: postId,
      },
    })
    const postIndex = createdPostIds.indexOf(postId)
    if (postIndex >= 0) {
      createdPostIds.splice(postIndex, 1)
    }
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

  it('应支持查看评论列表、详情、切换状态和删除', async () => {
    const createdPost = await prisma.post.create({
      data: {
        title: `Comment Target ${tempSuffix}`,
        slug: `comment-target-${tempSuffix}`,
        markdown: '# Target',
        tags: [],
        status: 'PUBLISHED',
      },
    })
    createdPostIds.push(createdPost.id)

    const createdComment = await prisma.comment.create({
      data: {
        postId: createdPost.id,
        authorName: 'Alice',
        authorEmail: 'alice@example.com',
        content: `First ${tempSuffix}`,
        status: 'PENDING',
      },
    })
    createdCommentIds.push(createdComment.id)

    const anonymousListResult = await anonymousClient.api.comment.get()
    expect(anonymousListResult.status).toBe(401)
    expect(anonymousListResult.error).toBeTruthy()

    const listResult = await authenticatedClient.api.comment.get({
      query: {
        postId: createdPost.id,
        status: 'pending',
        keyword: tempSuffix,
      },
    })
    expect(listResult.status).toBe(200)
    expect(listResult.error).toBeNull()
    expect(listResult.data?.items.some((item) => item.id === createdComment.id)).toBe(true)

    const detailResult = await getCommentClient(createdComment.id).get()
    expect(detailResult.status).toBe(200)
    expect(detailResult.error).toBeNull()
    expect(detailResult.data?.id).toBe(createdComment.id)
    expect(detailResult.data?.status).toBe('pending')

    const forbiddenListResult = await subjectClient.api.comment.get()
    expect(forbiddenListResult.status).toBe(403)
    expect(forbiddenListResult.error).toBeTruthy()

    const forbiddenStatusResult = await subjectClient.api.comment({ id: createdComment.id }).status.patch({
      status: 'approved',
    })
    expect(forbiddenStatusResult.status).toBe(403)
    expect(forbiddenStatusResult.error).toBeTruthy()

    const statusResult = await getCommentClient(createdComment.id).status.patch({
      status: 'approved',
    })
    expect(statusResult.status).toBe(200)
    expect(statusResult.error).toBeNull()
    expect(statusResult.data?.status).toBe('approved')

    const deleteResult = await getCommentClient(createdComment.id).delete()
    expect(deleteResult.status).toBe(204)
    expect(deleteResult.error).toBeNull()

    const deletedComment = await prisma.comment.findUnique({
      where: { id: createdComment.id },
    })
    expect(deletedComment?.status).toBe('DELETED')

    const deletedIndex = createdCommentIds.indexOf(createdComment.id)
    if (deletedIndex >= 0) {
      createdCommentIds.splice(deletedIndex, 1)
    }
    await prisma.comment.deleteMany({
      where: {
        id: createdComment.id,
      },
    })

    const postIndex = createdPostIds.indexOf(createdPost.id)
    if (postIndex >= 0) {
      createdPostIds.splice(postIndex, 1)
    }
    await prisma.post.deleteMany({
      where: {
        id: createdPost.id,
      },
    })
  })
  it('应支持 media 上传、列表、文件访问和删除', async () => {
    const anonymousListResult = await anonymousClient.api.media.get()
    expect(anonymousListResult.status).toBe(401)
    expect(anonymousListResult.error).toBeTruthy()

    const uploadResult = await authenticatedClient.api.media.upload.post({
      file: new File([`media-smoke-${tempSuffix}`], `eden-media-${tempSuffix}.txt`, {
        type: 'text/plain',
      }),
    })
    expect(uploadResult.status).toBe(200)
    expect(uploadResult.error).toBeNull()
    expect(uploadResult.data?.originalName).toBe(`eden-media-${tempSuffix}.txt`)
    expect(uploadResult.data?.mimeType).toContain('text/plain')
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
    expect(fileResponse.headers.get('content-type')).toContain('text/plain')

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

  it('页面预览应允许仅具备 PAGE 写权限的用户访问', async () => {
    const pagePreviewRole = await createRoleWithPermissions(`page-preview-${tempSuffix}`, [Permissions.PAGE.WRITE_ALL])

    await prisma.userRole.create({
      data: {
        userId: subjectUserId,
        roleId: pagePreviewRole.id,
        assignedBy: actorUserId,
      },
    })
    PermissionService.clearCache(subjectUserId)

    const pagePreviewResult = await subjectClient.api.preview.markdown.post({
      type: 'page',
      markdown: '# Page Title\n\nPage preview paragraph.',
    })

    expect(pagePreviewResult.status).toBe(200)
    expect(pagePreviewResult.error).toBeNull()
    expect(pagePreviewResult.data?.html).toContain('<h1 id="page-title">Page Title</h1>')

    const postPreviewResult = await subjectClient.api.preview.markdown.post({
      type: 'post',
      markdown: '# Post Title\n\nPost preview paragraph.',
    })

    expect(postPreviewResult.status).toBe(403)
    expect(postPreviewResult.error).toBeTruthy()
  })
})
