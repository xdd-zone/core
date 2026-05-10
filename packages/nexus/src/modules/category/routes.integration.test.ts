import type { PermissionString } from '@nexus/core/permissions'
import type { CookieFetcherSession, TestApp } from '../../test'
import type { AuthSession } from '../auth/model'
import type { Category, CategoryList } from './model'

import { beforeAll, describe, expect, it } from 'bun:test'

import {
  cleanupTestData,
  createCategoryFixture,
  createCookieFetcher,
  createTestApp,
  createTestRequest,
  createTestSuffix,
  expectErrorResponse,
  expectNoBody,
  grantPermissionsToUser,
  readJson,
  seedBasePermissions,
} from '../../test'
import { CategoryPermissions } from './permissions'

const TEST_APP_OPTIONS = {
  config: {
    auth: {
      methods: {
        emailPassword: {
          enabled: true,
          allowSignUp: true,
        },
      },
    },
    http: {
      requestLogger: {
        enabled: false,
      },
    },
    logger: {
      level: 'silent',
    },
  },
} as const

interface SignedInUser {
  session: CookieFetcherSession
  userId: string
}

async function signInTestUser(app: TestApp): Promise<SignedInUser> {
  const suffix = createTestSuffix('category-user')
  const session = createCookieFetcher(app)
  const response = await session.fetcher('http://localhost/api/auth/sign-up/email', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: `${suffix}@example.com`,
      password: 'password123',
      name: `Category User ${suffix}`,
    }),
  })

  expect(response.status).toBe(200)
  const body = await readJson<AuthSession>(response)

  return {
    session,
    userId: body.user.id,
  }
}

async function grantTestPermissions(userId: string, permissionKeys: readonly PermissionString[], roleIds: string[]) {
  const { role } = await grantPermissionsToUser(userId, permissionKeys, {
    roleName: createTestSuffix('category-role'),
  })
  roleIds.push(role.id)
}

async function requestJson(session: CookieFetcherSession, path: string, method: string, body: unknown) {
  return await session.fetcher(new URL(path, 'http://localhost').toString(), {
    method,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

describe('Category routes', () => {
  const { app } = createTestApp(TEST_APP_OPTIONS)

  beforeAll(async () => {
    await seedBasePermissions()
  })

  it('列表应返回分类分页数据', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const categoryIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [CategoryPermissions.READ_ALL], roleIds)

      const suffix = createTestSuffix('category-list')
      const category = await createCategoryFixture({
        suffix,
        data: {
          name: `列表分类 ${suffix}`,
          slug: `category-list-${suffix}`,
        },
      })
      categoryIds.push(category.id)

      const response = await user.session.fetcher(createTestRequest(`/api/category/?keyword=${suffix}`))

      expect(response.status).toBe(200)
      const body = await readJson<CategoryList>(response)
      expect(body.items.some((item) => item.id === category.id)).toBe(true)
    } finally {
      await cleanupTestData({ categoryIds, roleIds, userIds })
    }
  })

  it('创建分类应返回新分类', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const categoryIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [CategoryPermissions.WRITE_ALL], roleIds)

      const suffix = createTestSuffix('category-create')
      const response = await requestJson(user.session, '/api/category/', 'POST', {
        name: `创建分类 ${suffix}`,
        slug: `category-create-${suffix}`,
        description: '创建测试',
      })

      expect(response.status).toBe(200)
      const body = await readJson<Category>(response)
      categoryIds.push(body.id)
      expect(body.slug).toBe(`category-create-${suffix}`)
      expect(body.description).toBe('创建测试')
    } finally {
      await cleanupTestData({ categoryIds, roleIds, userIds })
    }
  })

  it('详情应返回指定分类', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const categoryIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [CategoryPermissions.READ_ALL], roleIds)

      const category = await createCategoryFixture()
      categoryIds.push(category.id)

      const response = await user.session.fetcher(createTestRequest(`/api/category/${category.id}`))

      expect(response.status).toBe(200)
      const body = await readJson<Category>(response)
      expect(body.id).toBe(category.id)
      expect(body.slug).toBe(category.slug)
    } finally {
      await cleanupTestData({ categoryIds, roleIds, userIds })
    }
  })

  it('更新分类应返回修改后的分类', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const categoryIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [CategoryPermissions.WRITE_ALL], roleIds)

      const category = await createCategoryFixture()
      categoryIds.push(category.id)

      const response = await requestJson(user.session, `/api/category/${category.id}`, 'PATCH', {
        name: '更新后的分类',
        isVisible: false,
      })

      expect(response.status).toBe(200)
      const body = await readJson<Category>(response)
      expect(body.name).toBe('更新后的分类')
      expect(body.isVisible).toBe(false)
    } finally {
      await cleanupTestData({ categoryIds, roleIds, userIds })
    }
  })

  it('删除分类应返回 204 且没有响应体', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const categoryIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [CategoryPermissions.WRITE_ALL], roleIds)

      const category = await createCategoryFixture()
      categoryIds.push(category.id)

      const response = await user.session.fetcher(
        createTestRequest(`/api/category/${category.id}`, {
          method: 'DELETE',
        }),
      )

      await expectNoBody(response)
      categoryIds.pop()
    } finally {
      await cleanupTestData({ categoryIds, roleIds, userIds })
    }
  })

  it('匿名访问分类列表应返回 401', async () => {
    const response = await app.handle(createTestRequest('/api/category/'))

    await expectErrorResponse(response, {
      status: 401,
      errorCode: 'UNAUTHORIZED',
    })
  })

  it('无权限访问分类列表应返回 403', async () => {
    const userIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)

      const response = await user.session.fetcher(createTestRequest('/api/category/'))

      await expectErrorResponse(response, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })
    } finally {
      await cleanupTestData({ userIds })
    }
  })

  it('无权限访问分类详情应返回 403', async () => {
    const userIds: string[] = []
    const categoryIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)

      const category = await createCategoryFixture()
      categoryIds.push(category.id)

      const response = await user.session.fetcher(createTestRequest(`/api/category/${category.id}`))

      await expectErrorResponse(response, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })
    } finally {
      await cleanupTestData({ categoryIds, userIds })
    }
  })

  it('只有 READ_ALL 时写操作应返回 403', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const categoryIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [CategoryPermissions.READ_ALL], roleIds)

      const category = await createCategoryFixture()
      categoryIds.push(category.id)

      const createResponse = await requestJson(user.session, '/api/category/', 'POST', {
        name: '只读不可创建',
      })
      await expectErrorResponse(createResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const updateResponse = await requestJson(user.session, `/api/category/${category.id}`, 'PATCH', {
        name: '只读不可更新',
      })
      await expectErrorResponse(updateResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const deleteResponse = await user.session.fetcher(
        createTestRequest(`/api/category/${category.id}`, {
          method: 'DELETE',
        }),
      )
      await expectErrorResponse(deleteResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })
    } finally {
      await cleanupTestData({ categoryIds, roleIds, userIds })
    }
  })

  it('只有 WRITE_ALL 时列表和详情可访问', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const categoryIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [CategoryPermissions.WRITE_ALL], roleIds)

      const category = await createCategoryFixture()
      categoryIds.push(category.id)

      const listResponse = await user.session.fetcher(createTestRequest('/api/category/'))
      expect(listResponse.status).toBe(200)

      const detailResponse = await user.session.fetcher(createTestRequest(`/api/category/${category.id}`))
      expect(detailResponse.status).toBe(200)
    } finally {
      await cleanupTestData({ categoryIds, roleIds, userIds })
    }
  })

  it('访问不存在分类详情应返回 404', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [CategoryPermissions.READ_ALL], roleIds)

      const response = await user.session.fetcher(createTestRequest(`/api/category/${createTestSuffix('missing')}`))

      await expectErrorResponse(response, {
        status: 404,
        errorCode: 'NOT_FOUND',
      })
    } finally {
      await cleanupTestData({ roleIds, userIds })
    }
  })

  it('更新和删除不存在分类应返回 404', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const missingId = createTestSuffix('missing-category')

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [CategoryPermissions.WRITE_ALL], roleIds)

      const updateResponse = await requestJson(user.session, `/api/category/${missingId}`, 'PATCH', {
        name: '不存在分类',
      })
      await expectErrorResponse(updateResponse, {
        status: 404,
        errorCode: 'NOT_FOUND',
      })

      const deleteResponse = await user.session.fetcher(
        createTestRequest(`/api/category/${missingId}`, {
          method: 'DELETE',
        }),
      )
      await expectErrorResponse(deleteResponse, {
        status: 404,
        errorCode: 'NOT_FOUND',
      })
    } finally {
      await cleanupTestData({ roleIds, userIds })
    }
  })

  it('非法创建请求体应返回 422', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [CategoryPermissions.WRITE_ALL], roleIds)

      const response = await requestJson(user.session, '/api/category/', 'POST', {
        name: '',
      })

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    } finally {
      await cleanupTestData({ roleIds, userIds })
    }
  })

  it('非法列表 query 应返回 422', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [CategoryPermissions.READ_ALL], roleIds)

      const response = await user.session.fetcher(createTestRequest('/api/category/?pageSize=101'))

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    } finally {
      await cleanupTestData({ roleIds, userIds })
    }
  })

  it('空更新请求体应返回 422', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const categoryIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [CategoryPermissions.WRITE_ALL], roleIds)

      const category = await createCategoryFixture()
      categoryIds.push(category.id)

      const response = await requestJson(user.session, `/api/category/${category.id}`, 'PATCH', {})

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    } finally {
      await cleanupTestData({ categoryIds, roleIds, userIds })
    }
  })
})
