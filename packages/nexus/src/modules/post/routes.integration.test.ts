import type { PermissionString } from '@nexus/core/permissions'
import type { Post, PostList } from './model'

import { afterEach, beforeAll, describe, expect, it } from 'bun:test'

import {
  createCategoryFixture,
  createIntegrationTestContext,
  createPostFixture,
  createTestSuffix,
  expectDateTime,
  expectErrorResponse,
  expectNoBody,
  seedBasePermissions,
} from '../../test'
import { PostPermissions } from './permissions'

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

async function requestJson<T>(
  path: string,
  method: string,
  body: unknown,
  runner = anonymousRunner,
): Promise<{ response: Response; body: T }> {
  return await integration.json<T>(
    path,
    {
      method,
      headers: integration.jsonHeaders(),
      body: JSON.stringify(body),
    },
    runner,
  )
}

async function requestJsonResponse(path: string, method: string, body: unknown, runner = anonymousRunner): Promise<Response> {
  return await runner(path, {
    method,
    headers: integration.jsonHeaders(),
    body: JSON.stringify(body),
  })
}

async function createActor(permissionKeys: readonly PermissionString[]) {
  return await integration.actor(permissionKeys, {
    prefix: 'post-user',
  })
}

function expectPostContract(
  post: Post,
  expected: {
    id?: string
    title?: string
    slug?: string
    markdown?: string
    excerpt?: string | null
    coverImage?: string | null
    status?: 'draft' | 'published'
    categoryId?: string | null
    category?: Post['category']
    tags?: string[]
    publishedAt?: string | null
  } = {},
) {
  expect(typeof post.id).toBe('string')
  expect(post.id.length).toBeGreaterThan(0)
  expect(typeof post.title).toBe('string')
  expect(typeof post.slug).toBe('string')
  expect(typeof post.markdown).toBe('string')
  expect(Array.isArray(post.tags)).toBe(true)
  expectDateTime(post.createdAt)
  expectDateTime(post.updatedAt)

  if (expected.id !== undefined) {
    expect(post.id).toBe(expected.id)
  }
  if (expected.title !== undefined) {
    expect(post.title).toBe(expected.title)
  }
  if (expected.slug !== undefined) {
    expect(post.slug).toBe(expected.slug)
  }
  if (expected.markdown !== undefined) {
    expect(post.markdown).toBe(expected.markdown)
  }
  if (expected.excerpt !== undefined) {
    expect(post.excerpt).toBe(expected.excerpt)
  }
  if (expected.coverImage !== undefined) {
    expect(post.coverImage).toBe(expected.coverImage)
  }
  if (expected.status !== undefined) {
    expect(post.status).toBe(expected.status)
  }
  if (expected.categoryId !== undefined) {
    expect(post.categoryId).toBe(expected.categoryId)
  }
  if (expected.category !== undefined) {
    expect(post.category).toEqual(expected.category)
  }
  if (expected.tags !== undefined) {
    expect(post.tags).toEqual(expected.tags)
  }
  if (expected.publishedAt !== undefined) {
    expect(post.publishedAt).toBe(expected.publishedAt)
  } else if (expected.status === 'published') {
    expectDateTime(post.publishedAt)
  } else if (expected.status === 'draft') {
    expect(post.publishedAt).toBeNull()
  }
}

function expectPostListContract(
  list: PostList,
  expected: {
    page: number
    pageSize: number
    total?: number
    totalPages?: number
  },
) {
  expect(Array.isArray(list.items)).toBe(true)
  expect(list.page).toBe(expected.page)
  expect(list.pageSize).toBe(expected.pageSize)
  expect(list.total).toBeGreaterThanOrEqual(0)
  expect(list.totalPages).toBeGreaterThanOrEqual(0)

  if (expected.total !== undefined) {
    expect(list.total).toBe(expected.total)
  }
  if (expected.totalPages !== undefined) {
    expect(list.totalPages).toBe(expected.totalPages)
  }
}

describe('Post routes', () => {
  beforeAll(async () => {
    await seedBasePermissions()
  })

  afterEach(async () => {
    await integration.cleanup()
  })

  describe('CRUD 主链', () => {
    it('应创建文章后完成列表、详情、更新和删除链路', async () => {
      const user = await createActor([PostPermissions.READ_ALL, PostPermissions.WRITE_ALL])
      const category = await createCategoryFixture()
      integration.track.categoryId(category.id)

      const suffix = createTestSuffix('post-crud')
      const createPayload = {
        title: `文章 ${suffix}`,
        slug: `post-crud-${suffix}`,
        markdown: '# 文章\n\n正文',
        excerpt: `摘要 ${suffix}`,
        coverImage: `https://example.com/${suffix}.png`,
        categoryId: category.id,
        tags: ['test', suffix],
      }
      const { response: createResponse, body: created } = await requestJson<Post>('/api/post/', 'POST', createPayload, user)

      expect(createResponse.status).toBe(200)
      integration.track.postId(created.id)
      expectPostContract(created, {
        title: createPayload.title,
        slug: createPayload.slug,
        markdown: createPayload.markdown,
        excerpt: createPayload.excerpt,
        coverImage: createPayload.coverImage,
        status: 'draft',
        categoryId: category.id,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        tags: createPayload.tags,
        publishedAt: null,
      })

      const { response: listResponse, body: list } = await integration.json<PostList>(
        `/api/post/?page=1&pageSize=10&keyword=${suffix}`,
        {},
        user,
      )

      expect(listResponse.status).toBe(200)
      expectPostListContract(list, {
        page: 1,
        pageSize: 10,
      })
      const listed = list.items.find((item) => item.id === created.id)
      expect(listed).toBeDefined()
      expectPostContract(listed!, {
        id: created.id,
        slug: createPayload.slug,
        status: 'draft',
        categoryId: category.id,
        tags: createPayload.tags,
        publishedAt: null,
      })

      const { response: detailResponse, body: detail } = await integration.json<Post>(`/api/post/${created.id}`, {}, user)
      expect(detailResponse.status).toBe(200)
      expectPostContract(detail, {
        id: created.id,
        title: createPayload.title,
        slug: createPayload.slug,
        markdown: createPayload.markdown,
        excerpt: createPayload.excerpt,
        coverImage: createPayload.coverImage,
        status: 'draft',
        categoryId: category.id,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        tags: createPayload.tags,
        publishedAt: null,
      })

      const updatePayload = {
        title: `更新后的文章 ${suffix}`,
        slug: `post-crud-updated-${suffix}`,
        excerpt: `更新后的摘要 ${suffix}`,
        coverImage: `https://example.com/${suffix}-updated.png`,
        tags: ['updated'],
      }
      const { response: updateResponse, body: updated } = await requestJson<Post>(
        `/api/post/${created.id}`,
        'PATCH',
        updatePayload,
        user,
      )
      expect(updateResponse.status).toBe(200)
      expectPostContract(updated, {
        id: created.id,
        title: updatePayload.title,
        slug: updatePayload.slug,
        markdown: createPayload.markdown,
        excerpt: updatePayload.excerpt,
        coverImage: updatePayload.coverImage,
        status: 'draft',
        categoryId: category.id,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        tags: updatePayload.tags,
        publishedAt: null,
      })

      const deleteResponse = await user(`/api/post/${created.id}`, {
        method: 'DELETE',
      })
      await expectNoBody(deleteResponse)
      integration.track.forget({ postId: created.id })

      const deletedDetailResponse = await user(`/api/post/${created.id}`)
      await expectErrorResponse(deletedDetailResponse, {
        status: 404,
        errorCode: 'NOT_FOUND',
      })
    })

    it('列表无匹配时应返回空结果和分页信息', async () => {
      const user = await createActor([PostPermissions.READ_ALL])
      const { response, body } = await integration.json<PostList>(
        `/api/post/?page=1&pageSize=5&keyword=${createTestSuffix('no-post-match')}`,
        {},
        user,
      )

      expect(response.status).toBe(200)
      expectPostListContract(body, {
        page: 1,
        pageSize: 5,
        total: 0,
        totalPages: 0,
      })
      expect(body.items).toEqual([])
    })
  })

  describe('权限', () => {
    const anonymousRequestCases = [
      {
        name: '匿名访问列表应返回 401',
        path: '/api/post/',
        init: undefined,
      },
      {
        name: '匿名访问详情应返回 401',
        path: '/api/post/post-id',
        init: undefined,
      },
      {
        name: '匿名创建文章应返回 401',
        path: '/api/post/',
        init: {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            title: '匿名文章',
            slug: 'anonymous-post',
            markdown: '# Anonymous',
            tags: [],
          }),
        },
      },
      {
        name: '匿名更新文章应返回 401',
        path: '/api/post/post-id',
        init: {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            title: '匿名更新',
          }),
        },
      },
      {
        name: '匿名删除文章应返回 401',
        path: '/api/post/post-id',
        init: {
          method: 'DELETE',
        },
      },
      {
        name: '匿名发布文章应返回 401',
        path: '/api/post/post-id/publish',
        init: {
          method: 'POST',
        },
      },
      {
        name: '匿名取消发布应返回 401',
        path: '/api/post/post-id/unpublish',
        init: {
          method: 'POST',
        },
      },
    ] as const

    for (const testCase of anonymousRequestCases) {
      it(testCase.name, async () => {
        const response = await anonymousRunner(testCase.path, testCase.init)

        await expectErrorResponse(response, {
          status: 401,
          errorCode: 'UNAUTHORIZED',
        })
      })
    }

    it('只有 READ_ALL 时可访问列表和详情，写操作应返回 403', async () => {
      const user = await createActor([PostPermissions.READ_ALL])
      const post = await createPostFixture()
      integration.track.postId(post.id)

      const { response: listResponse, body: list } = await integration.json<PostList>('/api/post/?page=1&pageSize=10', {}, user)
      expect(listResponse.status).toBe(200)
      expectPostListContract(list, {
        page: 1,
        pageSize: 10,
      })

      const { response: detailResponse, body: detail } = await integration.json<Post>(`/api/post/${post.id}`, {}, user)
      expect(detailResponse.status).toBe(200)
      expectPostContract(detail, {
        id: post.id,
        slug: post.slug,
        categoryId: post.categoryId,
        tags: post.tags,
      })

      await expectErrorResponse(
        await requestJsonResponse(
          '/api/post/',
          'POST',
          {
            title: '受限创建',
            slug: 'read-only-post',
            markdown: '# Read only',
            tags: [],
          },
          user,
        ),
        {
          status: 403,
          errorCode: 'FORBIDDEN',
        },
      )

      await expectErrorResponse(
        await requestJsonResponse(
          `/api/post/${post.id}`,
          'PATCH',
          {
            title: '受限更新',
          },
          user,
        ),
        {
          status: 403,
          errorCode: 'FORBIDDEN',
        },
      )

      await expectErrorResponse(
        await user(`/api/post/${post.id}`, {
          method: 'DELETE',
        }),
        {
          status: 403,
          errorCode: 'FORBIDDEN',
        },
      )
    })

    it('只有 WRITE_ALL 时写操作可用，读接口和发布接口应返回 403', async () => {
      const user = await createActor([PostPermissions.WRITE_ALL])
      const post = await createPostFixture()
      integration.track.postId(post.id)

      const createSuffix = createTestSuffix('writable-post')
      const { response: createResponse, body: created } = await requestJson<Post>(
        '/api/post/',
        'POST',
        {
          title: '可写文章',
          slug: `writable-${createSuffix}`,
          markdown: '# Writable',
          tags: ['writable'],
        },
        user,
      )

      expect(createResponse.status).toBe(200)
      integration.track.postId(created.id)
      expectPostContract(created, {
        title: '可写文章',
        slug: `writable-${createSuffix}`,
        markdown: '# Writable',
        status: 'draft',
        tags: ['writable'],
        publishedAt: null,
      })

      const { response: updateResponse, body: updated } = await requestJson<Post>(
        `/api/post/${created.id}`,
        'PATCH',
        {
          title: '已更新',
        },
        user,
      )
      expect(updateResponse.status).toBe(200)
      expectPostContract(updated, {
        id: created.id,
        title: '已更新',
        slug: created.slug,
        status: 'draft',
        tags: created.tags,
        publishedAt: null,
      })

      await expectErrorResponse(await user('/api/post/'), {
        status: 403,
        errorCode: 'FORBIDDEN',
      })
      await expectErrorResponse(await user(`/api/post/${post.id}`), {
        status: 403,
        errorCode: 'FORBIDDEN',
      })
      await expectErrorResponse(
        await user(`/api/post/${post.id}/publish`, {
          method: 'POST',
        }),
        {
          status: 403,
          errorCode: 'FORBIDDEN',
        },
      )
      await expectErrorResponse(
        await user(`/api/post/${post.id}/unpublish`, {
          method: 'POST',
        }),
        {
          status: 403,
          errorCode: 'FORBIDDEN',
        },
      )
    })

    it('只有 PUBLISH_ALL 时发布接口可用，其余接口应返回 403', async () => {
      const user = await createActor([PostPermissions.PUBLISH_ALL])
      const post = await createPostFixture()
      integration.track.postId(post.id)

      const { response: publishResponse, body: published } = await integration.json<Post>(
        `/api/post/${post.id}/publish`,
        { method: 'POST' },
        user,
      )
      expect(publishResponse.status).toBe(200)
      expectPostContract(published, {
        id: post.id,
        title: post.title,
        slug: post.slug,
        markdown: post.markdown,
        status: 'published',
        categoryId: post.categoryId,
        tags: post.tags,
      })

      const { response: unpublishResponse, body: unpublished } = await integration.json<Post>(
        `/api/post/${post.id}/unpublish`,
        { method: 'POST' },
        user,
      )
      expect(unpublishResponse.status).toBe(200)
      expectPostContract(unpublished, {
        id: post.id,
        status: 'draft',
        categoryId: post.categoryId,
        tags: post.tags,
        publishedAt: null,
      })

      await expectErrorResponse(await user('/api/post/'), {
        status: 403,
        errorCode: 'FORBIDDEN',
      })
      await expectErrorResponse(await user(`/api/post/${post.id}`), {
        status: 403,
        errorCode: 'FORBIDDEN',
      })
      await expectErrorResponse(
        await requestJsonResponse(
          '/api/post/',
          'POST',
          {
            title: '不可创建文章',
            slug: 'cannot-create-post',
            markdown: '# Cannot create',
            tags: [],
          },
          user,
        ),
        {
          status: 403,
          errorCode: 'FORBIDDEN',
        },
      )
      await expectErrorResponse(
        await requestJsonResponse(
          `/api/post/${post.id}`,
          'PATCH',
          {
            title: '不可更新',
          },
          user,
        ),
        {
          status: 403,
          errorCode: 'FORBIDDEN',
        },
      )
      await expectErrorResponse(
        await user(`/api/post/${post.id}`, {
          method: 'DELETE',
        }),
        {
          status: 403,
          errorCode: 'FORBIDDEN',
        },
      )
    })
  })

  describe('发布状态', () => {
    it('发布和取消发布应切换文章状态', async () => {
      const user = await createActor([PostPermissions.PUBLISH_ALL])
      const post = await createPostFixture()
      integration.track.postId(post.id)

      const { response: publishResponse, body: published } = await integration.json<Post>(
        `/api/post/${post.id}/publish`,
        { method: 'POST' },
        user,
      )
      expect(publishResponse.status).toBe(200)
      expectPostContract(published, {
        id: post.id,
        title: post.title,
        slug: post.slug,
        markdown: post.markdown,
        status: 'published',
        categoryId: post.categoryId,
        tags: post.tags,
      })

      const { response: unpublishResponse, body: unpublished } = await integration.json<Post>(
        `/api/post/${post.id}/unpublish`,
        { method: 'POST' },
        user,
      )
      expect(unpublishResponse.status).toBe(200)
      expectPostContract(unpublished, {
        id: post.id,
        title: post.title,
        slug: post.slug,
        markdown: post.markdown,
        status: 'draft',
        categoryId: post.categoryId,
        tags: post.tags,
        publishedAt: null,
      })
    })

    it('重复发布和重复取消发布都应保持幂等', async () => {
      const user = await createActor([PostPermissions.PUBLISH_ALL])
      const draftPost = await createPostFixture()
      const publishedPost = await createPostFixture({
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date('2026-05-01T00:00:00.000Z'),
        },
      })
      integration.track.postId(draftPost.id)
      integration.track.postId(publishedPost.id)

      const firstPublishResult = await integration.json<Post>(`/api/post/${draftPost.id}/publish`, { method: 'POST' }, user)
      expect(firstPublishResult.response.status).toBe(200)
      expectPostContract(firstPublishResult.body, {
        id: draftPost.id,
        status: 'published',
      })

      const secondPublishResult = await integration.json<Post>(`/api/post/${draftPost.id}/publish`, { method: 'POST' }, user)
      expect(secondPublishResult.response.status).toBe(200)
      expectPostContract(secondPublishResult.body, {
        id: draftPost.id,
        status: 'published',
        publishedAt: firstPublishResult.body.publishedAt,
      })

      const firstUnpublishResult = await integration.json<Post>(
        `/api/post/${publishedPost.id}/unpublish`,
        { method: 'POST' },
        user,
      )
      expect(firstUnpublishResult.response.status).toBe(200)
      expectPostContract(firstUnpublishResult.body, {
        id: publishedPost.id,
        status: 'draft',
        publishedAt: null,
      })

      const secondUnpublishResult = await integration.json<Post>(
        `/api/post/${publishedPost.id}/unpublish`,
        { method: 'POST' },
        user,
      )
      expect(secondUnpublishResult.response.status).toBe(200)
      expectPostContract(secondUnpublishResult.body, {
        id: publishedPost.id,
        status: 'draft',
        publishedAt: null,
      })
    })

    const invalidPublishCases = [
      {
        name: '发布前缺少必要内容时应返回 400',
        data: {
          markdown: ' ',
        },
      },
      {
        name: '发布前缺标题应返回 400',
        data: {
          title: ' ',
        },
      },
      {
        name: '发布前缺 slug 应返回 400',
        data: {
          slug: ' ',
        },
      },
    ] as const

    for (const testCase of invalidPublishCases) {
      it(testCase.name, async () => {
        const user = await createActor([PostPermissions.PUBLISH_ALL])
        const post = await createPostFixture({
          data: testCase.data,
        })
        integration.track.postId(post.id)

        const response = await user(`/api/post/${post.id}/publish`, {
          method: 'POST',
        })

        await expectErrorResponse(response, {
          status: 400,
          message: '发布前必须填写标题、slug 和 Markdown 内容',
        })
      })
    }
  })

  describe('校验与错误', () => {
    it('slug 冲突应返回 409', async () => {
      const user = await createActor([PostPermissions.WRITE_ALL])
      const suffix = createTestSuffix('post-conflict')
      const post = await createPostFixture({
        suffix,
        data: {
          slug: `post-conflict-${suffix}`,
        },
      })
      integration.track.postId(post.id)

      const response = await requestJsonResponse(
        '/api/post/',
        'POST',
        {
          title: '重复文章',
          slug: post.slug,
          markdown: '# 重复文章',
          tags: [],
        },
        user,
      )

      await expectErrorResponse(response, {
        status: 409,
        errorCode: 'PRISMA_P2002',
      })
    })

    it('空更新请求体应返回 422', async () => {
      const user = await createActor([PostPermissions.WRITE_ALL])
      const post = await createPostFixture()
      integration.track.postId(post.id)

      const response = await requestJsonResponse(`/api/post/${post.id}`, 'PATCH', {}, user)

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    })

    it('标签过长应返回 422', async () => {
      const user = await createActor([PostPermissions.WRITE_ALL])
      const suffix = createTestSuffix('post-tag')

      const response = await requestJsonResponse(
        '/api/post/',
        'POST',
        {
          title: `标签文章 ${suffix}`,
          slug: `post-tag-${suffix}`,
          markdown: '# 标签文章',
          tags: ['tag'.repeat(11)],
        },
        user,
      )

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    })

    it('列表 query 非法时应返回 422', async () => {
      const user = await createActor([PostPermissions.READ_ALL])
      const response = await user('/api/post/?page=abc')

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    })

    it('非法 JSON 请求体应返回 400', async () => {
      const user = await createActor([PostPermissions.WRITE_ALL])
      const response = await user('/api/post/', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: '{"title":"broken"',
      })

      await expectErrorResponse(response, {
        status: 400,
        errorCode: 'PARSE_ERROR',
      })
    })

    it('详情、更新、删除、发布、取消发布命中不存在文章时应返回 404', async () => {
      const missingId = createTestSuffix('missing-post')
      const user = await createActor([
        PostPermissions.READ_ALL,
        PostPermissions.WRITE_ALL,
        PostPermissions.PUBLISH_ALL,
      ])

      await expectErrorResponse(await user(`/api/post/${missingId}`), {
        status: 404,
        errorCode: 'NOT_FOUND',
      })
      await expectErrorResponse(
        await requestJsonResponse(`/api/post/${missingId}`, 'PATCH', { title: 'missing' }, user),
        {
          status: 404,
          errorCode: 'NOT_FOUND',
        },
      )
      await expectErrorResponse(
        await user(`/api/post/${missingId}`, {
          method: 'DELETE',
        }),
        {
          status: 404,
          errorCode: 'NOT_FOUND',
        },
      )
      await expectErrorResponse(
        await user(`/api/post/${missingId}/publish`, {
          method: 'POST',
        }),
        {
          status: 404,
          errorCode: 'NOT_FOUND',
        },
      )
      await expectErrorResponse(
        await user(`/api/post/${missingId}/unpublish`, {
          method: 'POST',
        }),
        {
          status: 404,
          errorCode: 'NOT_FOUND',
        },
      )
    })

    it('创建时分类不存在应返回 404', async () => {
      const user = await createActor([PostPermissions.WRITE_ALL])

      const response = await requestJsonResponse(
        '/api/post/',
        'POST',
        {
          title: 'missing category',
          slug: `missing-category-${createTestSuffix('post')}`,
          markdown: '# missing category',
          categoryId: createTestSuffix('missing-category'),
          tags: [],
        },
        user,
      )

      await expectErrorResponse(response, {
        status: 404,
        message: '分类不存在',
        errorCode: 'NOT_FOUND',
      })
    })

    it('更新时分类不存在应返回 404', async () => {
      const user = await createActor([PostPermissions.WRITE_ALL])
      const post = await createPostFixture()
      integration.track.postId(post.id)

      const response = await requestJsonResponse(
        `/api/post/${post.id}`,
        'PATCH',
        {
          categoryId: createTestSuffix('missing-category'),
        },
        user,
      )

      await expectErrorResponse(response, {
        status: 404,
        message: '分类不存在',
        errorCode: 'NOT_FOUND',
      })
    })
  })
})
