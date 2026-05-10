import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { Permissions } from '../public/permissions'
import {
  cleanupTestData,
  createAnonymousClient,
  createCategoryFixture,
  createCookieClient,
  createPostFixture,
  createTestApp,
  createTestRequest,
  createTestSuffix,
  expectDateTime,
  expectNoBody,
  grantPermissionsToUser,
  seedBasePermissions,
} from '../test'

interface Credentials {
  email: string
  name: string
  password: string
}

interface EdenErrorResult {
  error: {
    status: number
    value: unknown
  } | null
  status: number
}

const testApp = createTestApp({
  config: {
    auth: {
      methods: {
        emailPassword: {
          enabled: true,
          allowSignUp: true,
        },
      },
    },
  },
})

const anonymousClient = createAnonymousClient(testApp.app)
const publicSiteClient = anonymousClient.api['public-site']
const createdUserIds: string[] = []
const createdRoleIds: string[] = []
const createdPostIds: string[] = []
const createdCategoryIds: string[] = []

interface PublicSiteFixture {
  categoryId: string
  categorySlug: string
  postId: string
  postSlug: string
}

function createCredentials(label: string): Credentials {
  const suffix = createTestSuffix(`eden-${label}`)

  return {
    email: `${suffix}@example.com`,
    name: `Eden ${label} ${suffix}`,
    password: 'eden-smoke-pass-123',
  }
}

async function signUp(client: typeof anonymousClient, credentials: Credentials) {
  const result = await client.api.auth['sign-up'].email.post(credentials)

  expect(result.status).toBe(200)
  expect(result.error).toBeNull()
  expect(result.data?.user.email).toBe(credentials.email)
  expect(result.data?.user.name).toBe(credentials.name)

  const userId = result.data?.user.id
  expect(userId).toBeTruthy()

  if (!userId) {
    throw new Error('注册后未返回用户 ID')
  }

  createdUserIds.push(userId)

  return userId
}

function expectEdenError(
  result: EdenErrorResult,
  expected: {
    status: number
    message: string
    errorCode: string
  },
) {
  expect(result.status).toBe(expected.status)
  expect(result.error).toBeTruthy()
  expect(result.error?.status).toBe(expected.status)
  expect(result.error?.value).toEqual({
    code: expected.status,
    message: expected.message,
    data: null,
    errorCode: expected.errorCode,
  })
}

async function createPublicSiteFixture(): Promise<PublicSiteFixture> {
  const fixtureSuffix = createTestSuffix('eden-smoke')
  const category = await createCategoryFixture({
    suffix: fixtureSuffix,
    data: {
      name: `Smoke Category ${fixtureSuffix}`,
      slug: `smoke-category-${fixtureSuffix}`,
      isVisible: true,
    },
  })

  const post = await createPostFixture({
    suffix: fixtureSuffix,
    data: {
      title: `Smoke Post ${fixtureSuffix}`,
      slug: `smoke-post-${fixtureSuffix}`,
      markdown: `# Smoke Post ${fixtureSuffix}`,
      categoryId: category.id,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-05-10T00:00:00.000Z'),
      tags: ['smoke'],
    },
  })

  createdCategoryIds.push(category.id)
  createdPostIds.push(post.id)

  return {
    categoryId: category.id,
    categorySlug: category.slug,
    postId: post.id,
    postSlug: post.slug,
  }
}

describe('eden smoke', () => {
  beforeAll(async () => {
    await seedBasePermissions()
  })

  afterAll(async () => {
    await cleanupTestData({
      userIds: createdUserIds,
      roleIds: createdRoleIds,
      postIds: createdPostIds,
      categoryIds: createdCategoryIds,
    })
  })

  it('应返回健康状态', async () => {
    const result = await anonymousClient.api.health.get()

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data).toMatchObject({
      status: 'ok',
      service: testApp.context.config.app.name,
      version: testApp.context.config.openapi.version,
      database: {
        status: 'up',
      },
    })
    expect(typeof result.data?.uptime).toBe('number')
    expectDateTime(result.data?.timestamp)
  })

  it('匿名访问 get-session 应返回空会话', async () => {
    const result = await anonymousClient.api.auth['get-session'].get()

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data).toEqual({
      user: null,
      session: null,
      isAuthenticated: false,
    })
  })

  it('邮箱注册后应带登录态', async () => {
    const client = createCookieClient(testApp.app)
    const credentials = createCredentials('signup')
    const userId = await signUp(client.client, credentials)

    const meResult = await client.client.api.auth.me.get()

    expect(meResult.status).toBe(200)
    expect(meResult.error).toBeNull()
    expect(meResult.data?.isAuthenticated).toBe(true)
    expect(meResult.data?.user?.id).toBe(userId)
  })

  it('邮箱登录后应可登出且返回 204 空 body', async () => {
    const credentials = createCredentials('signin')
    await signUp(anonymousClient, credentials)

    const client = createCookieClient(testApp.app)
    const signInResult = await client.client.api.auth['sign-in'].email.post({
      email: credentials.email,
      password: credentials.password,
    })

    expect(signInResult.status).toBe(200)
    expect(signInResult.error).toBeNull()
    expect(signInResult.data?.user.email).toBe(credentials.email)

    const signOutResponse = await client.session.fetcher(createTestRequest('/api/auth/sign-out', { method: 'POST' }))
    await expectNoBody(signOutResponse)

    const sessionResult = await client.client.api.auth['get-session'].get()
    expect(sessionResult.status).toBe(200)
    expect(sessionResult.error).toBeNull()
    expect(sessionResult.data).toEqual({
      user: null,
      session: null,
      isAuthenticated: false,
    })

    const meResult = await client.client.api.auth.me.get()
    expectEdenError(meResult, {
      status: 401,
      message: '请先登录',
      errorCode: 'UNAUTHORIZED',
    })
  })

  it('后台用户列表应守住匿名 401、登录无权限 403 和授权后 200 契约', async () => {
    const anonymousResult = await anonymousClient.api.user.get()
    expectEdenError(anonymousResult, {
      status: 401,
      message: '请先登录',
      errorCode: 'UNAUTHORIZED',
    })

    const client = createCookieClient(testApp.app)
    const credentials = createCredentials('permission')
    await signUp(client.client, credentials)

    const deniedResult = await client.client.api.user.get()
    expectEdenError(deniedResult, {
      status: 403,
      message: '权限不足',
      errorCode: 'FORBIDDEN',
    })

    const privilegedClient = createCookieClient(testApp.app)
    const privilegedCredentials = createCredentials('permission-admin')
    const privilegedUserId = await signUp(privilegedClient.client, privilegedCredentials)
    const granted = await grantPermissionsToUser(privilegedUserId, [Permissions.USER.READ_ALL], {
      roleName: createTestSuffix('eden-role'),
    })
    createdRoleIds.push(granted.role.id)

    const allowedResult = await privilegedClient.client.api.user.get({
      query: {
        keyword: privilegedCredentials.email,
        page: 1,
        pageSize: 10,
      },
    })

    expect(allowedResult.status).toBe(200)
    expect(allowedResult.error).toBeNull()
    expect(allowedResult.data).toMatchObject({
      page: 1,
      pageSize: 10,
    })
    expect(typeof allowedResult.data?.total).toBe('number')
    expect(allowedResult.data?.items.some((item) => item.id === privilegedUserId && item.email === privilegedCredentials.email)).toBe(true)
  })

  it('公开站点应只暴露公开文章契约字段', async () => {
    const fixture = await createPublicSiteFixture()

    const result = await publicSiteClient.posts.get({
      query: {
        categorySlug: fixture.categorySlug,
        page: 1,
        pageSize: 10,
      },
    })

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data).toMatchObject({
      page: 1,
      pageSize: 10,
    })

    const item = result.data?.items.find((entry) => entry.id === fixture.postId)
    expect(item).toMatchObject({
      id: fixture.postId,
      slug: fixture.postSlug,
      title: expect.stringContaining('Smoke Post'),
      category: {
        id: fixture.categoryId,
        slug: fixture.categorySlug,
      },
      tags: ['smoke'],
    })
    expectDateTime(item?.publishedAt)

    const detailResult = await publicSiteClient.posts({ slug: fixture.postSlug }).get()
    expect(detailResult.status).toBe(200)
    expect(detailResult.error).toBeNull()
    expect(detailResult.data).toMatchObject({
      id: fixture.postId,
      slug: fixture.postSlug,
      markdown: expect.stringContaining('# Smoke Post'),
      category: {
        id: fixture.categoryId,
        slug: fixture.categorySlug,
      },
      tags: ['smoke'],
    })
  })
})
