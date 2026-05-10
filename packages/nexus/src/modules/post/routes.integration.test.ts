import type { Post, PostList } from './model'

import { beforeAll, describe, expect, it } from 'bun:test'

import {
  createCategoryFixture,
  createIntegrationTestContext,
  createPostFixture,
  createTestSuffix,
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

async function requestJson(path: string, method: string, body: unknown, runner = anonymousRunner) {
  return await runner(path, {
    method,
    headers: integration.jsonHeaders(),
    body: JSON.stringify(body),
  })
}

describe('Post routes', () => {
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

  beforeAll(async () => {
    await seedBasePermissions()
  })

  for (const testCase of anonymousRequestCases) {
    it(testCase.name, async () => {
      const response = await anonymousRunner(testCase.path, testCase.init)

      await expectErrorResponse(response, {
        status: 401,
        errorCode: 'UNAUTHORIZED',
      })
    })
  }

  it('CRUD 应创建、读取、更新并删除文章', async () => {
    try {
      const user = await integration.actor([PostPermissions.READ_ALL, PostPermissions.WRITE_ALL], {
        prefix: 'post-user',
      })

      const category = await createCategoryFixture()
      integration.track.categoryId(category.id)

      const suffix = createTestSuffix('post-crud')
      const createResponse = await requestJson(
        '/api/post/',
        'POST',
        {
          title: `文章 ${suffix}`,
          slug: `post-crud-${suffix}`,
          markdown: '# 文章\n\n正文',
          categoryId: category.id,
          tags: ['test'],
        },
        user,
      )

      expect(createResponse.status).toBe(200)
      const created = (await createResponse.json()) as Post
      integration.track.postId(created.id)
      expect(created.slug).toBe(`post-crud-${suffix}`)
      expect(created.categoryId).toBe(category.id)

      const listResponse = await user(`/api/post/?keyword=${suffix}`)
      expect(listResponse.status).toBe(200)
      const list = (await listResponse.json()) as PostList
      expect(list.items.some((item) => item.id === created.id)).toBe(true)

      const detailResponse = await user(`/api/post/${created.id}`)
      expect(detailResponse.status).toBe(200)
      const detail = (await detailResponse.json()) as Post
      expect(detail.id).toBe(created.id)

      const updateResponse = await requestJson(
        `/api/post/${created.id}`,
        'PATCH',
        {
          title: '更新后的文章',
          tags: ['updated'],
        },
        user,
      )
      expect(updateResponse.status).toBe(200)
      const updated = (await updateResponse.json()) as Post
      expect(updated.title).toBe('更新后的文章')
      expect(updated.tags).toEqual(['updated'])

      const deleteResponse = await user(`/api/post/${created.id}`, {
        method: 'DELETE',
      })
      await expectNoBody(deleteResponse)
      integration.track.forget({ postId: created.id })
    } finally {
      await integration.cleanup()
    }
  })

  it('发布和取消发布应切换文章状态', async () => {
    try {
      const user = await integration.actor([PostPermissions.PUBLISH_ALL], { prefix: 'post-user' })

      const post = await createPostFixture()
      integration.track.postId(post.id)

      const publishResponse = await user(`/api/post/${post.id}/publish`, {
        method: 'POST',
      })
      expect(publishResponse.status).toBe(200)
      const published = (await publishResponse.json()) as Post
      expect(published.status).toBe('published')
      expect(published.publishedAt).not.toBeNull()

      const unpublishResponse = await user(`/api/post/${post.id}/unpublish`, {
        method: 'POST',
      })
      expect(unpublishResponse.status).toBe(200)
      const unpublished = (await unpublishResponse.json()) as Post
      expect(unpublished.status).toBe('draft')
      expect(unpublished.publishedAt).toBeNull()
    } finally {
      await integration.cleanup()
    }
  })

  it('只有 READ_ALL 时可访问列表和详情，写操作应返回 403', async () => {
    try {
      const user = await integration.actor([PostPermissions.READ_ALL], { prefix: 'post-user' })

      const post = await createPostFixture()
      integration.track.postId(post.id)

      const listResponse = await user('/api/post/')
      expect(listResponse.status).toBe(200)

      const detailResponse = await user(`/api/post/${post.id}`)
      expect(detailResponse.status).toBe(200)

      const createResponse = await requestJson(
        '/api/post/',
        'POST',
        {
          title: '受限创建',
          slug: 'read-only-post',
          markdown: '# Read only',
          tags: [],
        },
        user,
      )
      await expectErrorResponse(createResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const updateResponse = await requestJson(
        `/api/post/${post.id}`,
        'PATCH',
        {
          title: '受限更新',
        },
        user,
      )
      await expectErrorResponse(updateResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const deleteResponse = await user(`/api/post/${post.id}`, {
        method: 'DELETE',
      })
      await expectErrorResponse(deleteResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })
    } finally {
      await integration.cleanup()
    }
  })

  it('只有 WRITE_ALL 时写操作可用，读接口和发布接口应返回 403', async () => {
    try {
      const user = await integration.actor([PostPermissions.WRITE_ALL], { prefix: 'post-user' })

      const post = await createPostFixture()
      integration.track.postId(post.id)

      const createResponse = await requestJson(
        '/api/post/',
        'POST',
        {
          title: '可写文章',
          slug: `writable-${createTestSuffix('post')}`,
          markdown: '# Writable',
          tags: [],
        },
        user,
      )
      expect(createResponse.status).toBe(200)
      const created = (await createResponse.json()) as Post
      integration.track.postId(created.id)

      const updateResponse = await requestJson(
        `/api/post/${created.id}`,
        'PATCH',
        {
          title: '已更新',
        },
        user,
      )
      expect(updateResponse.status).toBe(200)

      const listResponse = await user('/api/post/')
      await expectErrorResponse(listResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const detailResponse = await user(`/api/post/${post.id}`)
      await expectErrorResponse(detailResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const publishResponse = await user(`/api/post/${post.id}/publish`, {
        method: 'POST',
      })
      await expectErrorResponse(publishResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const unpublishResponse = await user(`/api/post/${post.id}/unpublish`, {
        method: 'POST',
      })
      await expectErrorResponse(unpublishResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })
    } finally {
      await integration.cleanup()
    }
  })

  it('只有 PUBLISH_ALL 时发布接口可用，其余接口应返回 403', async () => {
    try {
      const user = await integration.actor([PostPermissions.PUBLISH_ALL], { prefix: 'post-user' })

      const post = await createPostFixture()
      integration.track.postId(post.id)

      const publishResponse = await user(`/api/post/${post.id}/publish`, {
        method: 'POST',
      })
      expect(publishResponse.status).toBe(200)

      const unpublishResponse = await user(`/api/post/${post.id}/unpublish`, {
        method: 'POST',
      })
      expect(unpublishResponse.status).toBe(200)

      const listResponse = await user('/api/post/')
      await expectErrorResponse(listResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const detailResponse = await user(`/api/post/${post.id}`)
      await expectErrorResponse(detailResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const createResponse = await requestJson(
        '/api/post/',
        'POST',
        {
          title: '不可创建文章',
          slug: 'cannot-create-post',
          markdown: '# Cannot create',
          tags: [],
        },
        user,
      )
      await expectErrorResponse(createResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const updateResponse = await requestJson(
        `/api/post/${post.id}`,
        'PATCH',
        {
          title: '不可更新',
        },
        user,
      )
      await expectErrorResponse(updateResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const deleteResponse = await user(`/api/post/${post.id}`, {
        method: 'DELETE',
      })
      await expectErrorResponse(deleteResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })
    } finally {
      await integration.cleanup()
    }
  })

  it('slug 冲突应返回 409', async () => {
    try {
      const user = await integration.actor([PostPermissions.WRITE_ALL], { prefix: 'post-user' })

      const suffix = createTestSuffix('post-conflict')
      const post = await createPostFixture({
        suffix,
        data: {
          slug: `post-conflict-${suffix}`,
        },
      })
      integration.track.postId(post.id)

      const response = await requestJson(
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
    } finally {
      await integration.cleanup()
    }
  })

  it('空更新请求体应返回 422', async () => {
    try {
      const user = await integration.actor([PostPermissions.WRITE_ALL], { prefix: 'post-user' })

      const post = await createPostFixture()
      integration.track.postId(post.id)

      const response = await requestJson(`/api/post/${post.id}`, 'PATCH', {}, user)

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    } finally {
      await integration.cleanup()
    }
  })

  it('标签过长应返回 422', async () => {
    try {
      const user = await integration.actor([PostPermissions.WRITE_ALL], { prefix: 'post-user' })

      const suffix = createTestSuffix('post-tag')
      const response = await requestJson(
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
    } finally {
      await integration.cleanup()
    }
  })

  it('列表 query 非法时应返回 422', async () => {
    try {
      const user = await integration.actor([PostPermissions.READ_ALL], { prefix: 'post-user' })

      const response = await user('/api/post/?page=abc')

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    } finally {
      await integration.cleanup()
    }
  })

  it('非法 JSON 请求体应返回 400', async () => {
    try {
      const user = await integration.actor([PostPermissions.WRITE_ALL], { prefix: 'post-user' })

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
    } finally {
      await integration.cleanup()
    }
  })

  it('详情、更新、删除、发布、取消发布命中不存在文章时应返回 404', async () => {
    const missingId = createTestSuffix('missing-post')

    try {
      const user = await integration.actor(
        [PostPermissions.READ_ALL, PostPermissions.WRITE_ALL, PostPermissions.PUBLISH_ALL],
        {
          prefix: 'post-user',
        },
      )

      const detailResponse = await user(`/api/post/${missingId}`)
      await expectErrorResponse(detailResponse, {
        status: 404,
        errorCode: 'NOT_FOUND',
      })

      const updateResponse = await requestJson(
        `/api/post/${missingId}`,
        'PATCH',
        {
          title: 'missing',
        },
        user,
      )
      await expectErrorResponse(updateResponse, {
        status: 404,
        errorCode: 'NOT_FOUND',
      })

      const deleteResponse = await user(`/api/post/${missingId}`, {
        method: 'DELETE',
      })
      await expectErrorResponse(deleteResponse, {
        status: 404,
        errorCode: 'NOT_FOUND',
      })

      const publishResponse = await user(`/api/post/${missingId}/publish`, {
        method: 'POST',
      })
      await expectErrorResponse(publishResponse, {
        status: 404,
        errorCode: 'NOT_FOUND',
      })

      const unpublishResponse = await user(`/api/post/${missingId}/unpublish`, {
        method: 'POST',
      })
      await expectErrorResponse(unpublishResponse, {
        status: 404,
        errorCode: 'NOT_FOUND',
      })
    } finally {
      await integration.cleanup()
    }
  })

  it('发布前缺少必要内容时应返回 400', async () => {
    try {
      const user = await integration.actor([PostPermissions.PUBLISH_ALL], { prefix: 'post-user' })

      const post = await createPostFixture({
        data: {
          markdown: ' ',
        },
      })
      integration.track.postId(post.id)

      const response = await user(`/api/post/${post.id}/publish`, {
        method: 'POST',
      })

      const body = await expectErrorResponse(response, {
        status: 400,
      })
      expect(body.message).toBe('发布前必须填写标题、slug 和 Markdown 内容')
    } finally {
      await integration.cleanup()
    }
  })

  it('创建时分类不存在应返回 404', async () => {
    try {
      const user = await integration.actor([PostPermissions.WRITE_ALL], { prefix: 'post-user' })

      const response = await requestJson(
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
    } finally {
      await integration.cleanup()
    }
  })

  it('更新时分类不存在应返回 404', async () => {
    try {
      const user = await integration.actor([PostPermissions.WRITE_ALL], { prefix: 'post-user' })

      const post = await createPostFixture()
      integration.track.postId(post.id)

      const response = await requestJson(
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
    } finally {
      await integration.cleanup()
    }
  })

  it('发布前缺标题应返回 400', async () => {
    try {
      const user = await integration.actor([PostPermissions.PUBLISH_ALL], { prefix: 'post-user' })

      const post = await createPostFixture({
        data: {
          title: ' ',
        },
      })
      integration.track.postId(post.id)

      const response = await user(`/api/post/${post.id}/publish`, {
        method: 'POST',
      })

      await expectErrorResponse(response, {
        status: 400,
        message: '发布前必须填写标题、slug 和 Markdown 内容',
      })
    } finally {
      await integration.cleanup()
    }
  })

  it('发布前缺 slug 应返回 400', async () => {
    try {
      const user = await integration.actor([PostPermissions.PUBLISH_ALL], { prefix: 'post-user' })

      const post = await createPostFixture({
        data: {
          slug: ' ',
        },
      })
      integration.track.postId(post.id)

      const response = await user(`/api/post/${post.id}/publish`, {
        method: 'POST',
      })

      await expectErrorResponse(response, {
        status: 400,
        message: '发布前必须填写标题、slug 和 Markdown 内容',
      })
    } finally {
      await integration.cleanup()
    }
  })

  it('重复发布和重复取消发布都应保持幂等', async () => {
    try {
      const user = await integration.actor([PostPermissions.PUBLISH_ALL], { prefix: 'post-user' })

      const draftPost = await createPostFixture()
      const publishedPost = await createPostFixture({
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date('2026-05-01T00:00:00.000Z'),
        },
      })
      integration.track.postId(draftPost.id)
      integration.track.postId(publishedPost.id)

      const firstPublishResponse = await user(`/api/post/${draftPost.id}/publish`, {
        method: 'POST',
      })
      const firstPublish = (await firstPublishResponse.json()) as Post

      const secondPublishResponse = await user(`/api/post/${draftPost.id}/publish`, {
        method: 'POST',
      })
      expect(secondPublishResponse.status).toBe(200)
      const secondPublish = (await secondPublishResponse.json()) as Post
      expect(secondPublish.status).toBe('published')
      expect(secondPublish.publishedAt).toBe(firstPublish.publishedAt)

      const firstUnpublishResponse = await user(`/api/post/${publishedPost.id}/unpublish`, {
        method: 'POST',
      })
      expect(firstUnpublishResponse.status).toBe(200)
      const firstUnpublish = (await firstUnpublishResponse.json()) as Post
      expect(firstUnpublish.status).toBe('draft')
      expect(firstUnpublish.publishedAt).toBeNull()

      const secondUnpublishResponse = await user(`/api/post/${publishedPost.id}/unpublish`, {
        method: 'POST',
      })
      expect(secondUnpublishResponse.status).toBe(200)
      const secondUnpublish = (await secondUnpublishResponse.json()) as Post
      expect(secondUnpublish.status).toBe('draft')
      expect(secondUnpublish.publishedAt).toBeNull()
    } finally {
      await integration.cleanup()
    }
  })
})
