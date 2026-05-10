import type { IntegrationRequestRunner } from '@nexus/test'
import type { Category, CategoryList } from './model'

import {
  createCategoryFixture,
  createIntegrationTestContext,
  createTestSuffix,
  expectErrorResponse,
  expectNoBody,
  seedBasePermissions,
} from '@nexus/test'
import { afterEach, beforeAll, describe, expect, it } from 'bun:test'
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

const integration = createIntegrationTestContext(TEST_APP_OPTIONS)
const anonymousRunner = integration.anonymous

async function requestJson(path: string, method: string, body: unknown, runner: IntegrationRequestRunner = anonymousRunner) {
  return await runner(path, {
    method,
    headers: integration.jsonHeaders(),
    body: JSON.stringify(body),
  })
}

describe('Category routes', () => {
  beforeAll(async () => {
    await seedBasePermissions()
  })

  afterEach(async () => {
    await integration.cleanup()
  })

  it('列表应返回分类分页数据', async () => {
    const user = await integration.actor([CategoryPermissions.READ_ALL], { prefix: 'category-user' })
    const suffix = createTestSuffix('category-list')
    const category = await createCategoryFixture({
      suffix,
      data: {
        name: `列表分类 ${suffix}`,
        slug: `category-list-${suffix}`,
      },
    })
    integration.track.categoryId(category.id)

    const { response, body } = await integration.json<CategoryList>(`/api/category/?keyword=${suffix}`, {}, user)

    expect(response.status).toBe(200)
    expect(body.items.some((item) => item.id === category.id)).toBe(true)
  })

  it('创建分类应返回新分类', async () => {
    const user = await integration.actor([CategoryPermissions.WRITE_ALL], { prefix: 'category-user' })
    const suffix = createTestSuffix('category-create')

    const response = await requestJson(
      '/api/category/',
      'POST',
      {
        name: `创建分类 ${suffix}`,
        slug: `category-create-${suffix}`,
        description: '创建测试',
      },
      user,
    )
    const body = (await response.json()) as Category
    integration.track.categoryId(body.id)

    expect(response.status).toBe(200)
    expect(body.slug).toBe(`category-create-${suffix}`)
    expect(body.description).toBe('创建测试')
  })

  it('详情应返回指定分类', async () => {
    const user = await integration.actor([CategoryPermissions.READ_ALL], { prefix: 'category-user' })
    const category = await createCategoryFixture()
    integration.track.categoryId(category.id)

    const { response, body } = await integration.json<Category>(`/api/category/${category.id}`, {}, user)

    expect(response.status).toBe(200)
    expect(body.id).toBe(category.id)
    expect(body.slug).toBe(category.slug)
  })

  it('更新分类应返回修改后的分类', async () => {
    const user = await integration.actor([CategoryPermissions.WRITE_ALL], { prefix: 'category-user' })
    const category = await createCategoryFixture()
    integration.track.categoryId(category.id)

    const response = await requestJson(
      `/api/category/${category.id}`,
      'PATCH',
      {
        name: '更新后的分类',
        isVisible: false,
      },
      user,
    )
    const body = (await response.json()) as Category

    expect(response.status).toBe(200)
    expect(body.name).toBe('更新后的分类')
    expect(body.isVisible).toBe(false)
  })

  it('删除分类应返回 204 且没有响应体', async () => {
    const user = await integration.actor([CategoryPermissions.WRITE_ALL], { prefix: 'category-user' })
    const category = await createCategoryFixture()
    integration.track.categoryId(category.id)

    const response = await user(`/api/category/${category.id}`, {
      method: 'DELETE',
    })

    await expectNoBody(response)
  })

  it('匿名访问分类列表应返回 401', async () => {
    const response = await anonymousRunner('/api/category/')

    await expectErrorResponse(response, {
      status: 401,
      errorCode: 'UNAUTHORIZED',
    })
  })

  it('无权限访问分类列表应返回 403', async () => {
    const user = await integration.actor([], { prefix: 'category-user' })
    const response = await user('/api/category/')

    await expectErrorResponse(response, {
      status: 403,
      errorCode: 'FORBIDDEN',
    })
  })

  it('无权限访问分类详情应返回 403', async () => {
    const user = await integration.actor([], { prefix: 'category-user' })
    const category = await createCategoryFixture()
    integration.track.categoryId(category.id)

    const response = await user(`/api/category/${category.id}`)

    await expectErrorResponse(response, {
      status: 403,
      errorCode: 'FORBIDDEN',
    })
  })

  it('只有 READ_ALL 时写操作应返回 403', async () => {
    const user = await integration.actor([CategoryPermissions.READ_ALL], { prefix: 'category-user' })
    const category = await createCategoryFixture()
    integration.track.categoryId(category.id)

    const createResponse = await requestJson(
      '/api/category/',
      'POST',
      {
        name: '只读不可创建',
      },
      user,
    )
    await expectErrorResponse(createResponse, {
      status: 403,
      errorCode: 'FORBIDDEN',
    })

    const updateResponse = await requestJson(
      `/api/category/${category.id}`,
      'PATCH',
      {
        name: '只读不可更新',
      },
      user,
    )
    await expectErrorResponse(updateResponse, {
      status: 403,
      errorCode: 'FORBIDDEN',
    })

    const deleteResponse = await user(`/api/category/${category.id}`, {
      method: 'DELETE',
    })
    await expectErrorResponse(deleteResponse, {
      status: 403,
      errorCode: 'FORBIDDEN',
    })
  })

  it('只有 WRITE_ALL 时列表和详情可访问', async () => {
    const user = await integration.actor([CategoryPermissions.WRITE_ALL], { prefix: 'category-user' })
    const category = await createCategoryFixture()
    integration.track.categoryId(category.id)

    const listResponse = await user('/api/category/')
    expect(listResponse.status).toBe(200)

    const detailResponse = await user(`/api/category/${category.id}`)
    expect(detailResponse.status).toBe(200)
  })

  it('访问不存在分类详情应返回 404', async () => {
    const user = await integration.actor([CategoryPermissions.READ_ALL], { prefix: 'category-user' })
    const response = await user(`/api/category/${createTestSuffix('missing')}`)

    await expectErrorResponse(response, {
      status: 404,
      errorCode: 'NOT_FOUND',
    })
  })

  it('更新和删除不存在分类应返回 404', async () => {
    const user = await integration.actor([CategoryPermissions.WRITE_ALL], { prefix: 'category-user' })
    const missingId = createTestSuffix('missing-category')

    const updateResponse = await requestJson(
      `/api/category/${missingId}`,
      'PATCH',
      {
        name: '不存在分类',
      },
      user,
    )
    await expectErrorResponse(updateResponse, {
      status: 404,
      errorCode: 'NOT_FOUND',
    })

    const deleteResponse = await user(`/api/category/${missingId}`, {
      method: 'DELETE',
    })
    await expectErrorResponse(deleteResponse, {
      status: 404,
      errorCode: 'NOT_FOUND',
    })
  })

  it('非法创建请求体应返回 422', async () => {
    const user = await integration.actor([CategoryPermissions.WRITE_ALL], { prefix: 'category-user' })
    const response = await requestJson(
      '/api/category/',
      'POST',
      {
        name: '',
      },
      user,
    )

    await expectErrorResponse(response, {
      status: 422,
      errorCode: 'VALIDATION',
    })
  })

  it('非法列表 query 应返回 422', async () => {
    const user = await integration.actor([CategoryPermissions.READ_ALL], { prefix: 'category-user' })
    const response = await user('/api/category/?pageSize=101')

    await expectErrorResponse(response, {
      status: 422,
      errorCode: 'VALIDATION',
    })
  })

  it('空更新请求体应返回 422', async () => {
    const user = await integration.actor([CategoryPermissions.WRITE_ALL], { prefix: 'category-user' })
    const category = await createCategoryFixture()
    integration.track.categoryId(category.id)

    const response = await requestJson(`/api/category/${category.id}`, 'PATCH', {}, user)

    await expectErrorResponse(response, {
      status: 422,
      errorCode: 'VALIDATION',
    })
  })
})
