import type { PermissionString } from '@nexus/core/permissions'
import type { CookieFetcherSession, TestApp } from '../../test'
import type { AuthSession } from '../auth/model'
import type { Post, PostList } from './model'

import { beforeAll, describe, expect, it } from 'bun:test'

import {
  cleanupTestData,
  createCategoryFixture,
  createCookieFetcher,
  createPostFixture,
  createTestApp,
  createTestRequest,
  createTestSuffix,
  expectErrorResponse,
  expectNoBody,
  grantPermissionsToUser,
  readJson,
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

interface SignedInUser {
  session: CookieFetcherSession
  userId: string
}

async function signInTestUser(app: TestApp): Promise<SignedInUser> {
  const suffix = createTestSuffix('post-user')
  const session = createCookieFetcher(app)
  const response = await session.fetcher('http://localhost/api/auth/sign-up/email', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: `${suffix}@example.com`,
      password: 'password123',
      name: `Post User ${suffix}`,
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
    roleName: createTestSuffix('post-role'),
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

describe('Post routes', () => {
  const { app } = createTestApp(TEST_APP_OPTIONS)
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
      const response = await app.handle(createTestRequest(testCase.path, testCase.init))

      await expectErrorResponse(response, {
        status: 401,
        errorCode: 'UNAUTHORIZED',
      })
    })
  }

  it('CRUD 应创建、读取、更新并删除文章', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const categoryIds: string[] = []
    const postIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.READ_ALL, PostPermissions.WRITE_ALL], roleIds)

      const category = await createCategoryFixture()
      categoryIds.push(category.id)

      const suffix = createTestSuffix('post-crud')
      const createResponse = await requestJson(user.session, '/api/post/', 'POST', {
        title: `文章 ${suffix}`,
        slug: `post-crud-${suffix}`,
        markdown: '# 文章\n\n正文',
        categoryId: category.id,
        tags: ['test'],
      })

      expect(createResponse.status).toBe(200)
      const created = await readJson<Post>(createResponse)
      postIds.push(created.id)
      expect(created.slug).toBe(`post-crud-${suffix}`)
      expect(created.categoryId).toBe(category.id)

      const listResponse = await user.session.fetcher(createTestRequest(`/api/post/?keyword=${suffix}`))
      expect(listResponse.status).toBe(200)
      const list = await readJson<PostList>(listResponse)
      expect(list.items.some((item) => item.id === created.id)).toBe(true)

      const detailResponse = await user.session.fetcher(createTestRequest(`/api/post/${created.id}`))
      expect(detailResponse.status).toBe(200)
      const detail = await readJson<Post>(detailResponse)
      expect(detail.id).toBe(created.id)

      const updateResponse = await requestJson(user.session, `/api/post/${created.id}`, 'PATCH', {
        title: '更新后的文章',
        tags: ['updated'],
      })
      expect(updateResponse.status).toBe(200)
      const updated = await readJson<Post>(updateResponse)
      expect(updated.title).toBe('更新后的文章')
      expect(updated.tags).toEqual(['updated'])

      const deleteResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${created.id}`, {
          method: 'DELETE',
        }),
      )
      await expectNoBody(deleteResponse)
      postIds.pop()
    } finally {
      await cleanupTestData({ categoryIds, postIds, roleIds, userIds })
    }
  })

  it('发布和取消发布应切换文章状态', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const postIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.PUBLISH_ALL], roleIds)

      const post = await createPostFixture()
      postIds.push(post.id)

      const publishResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${post.id}/publish`, {
          method: 'POST',
        }),
      )
      expect(publishResponse.status).toBe(200)
      const published = await readJson<Post>(publishResponse)
      expect(published.status).toBe('published')
      expect(published.publishedAt).not.toBeNull()

      const unpublishResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${post.id}/unpublish`, {
          method: 'POST',
        }),
      )
      expect(unpublishResponse.status).toBe(200)
      const unpublished = await readJson<Post>(unpublishResponse)
      expect(unpublished.status).toBe('draft')
      expect(unpublished.publishedAt).toBeNull()
    } finally {
      await cleanupTestData({ postIds, roleIds, userIds })
    }
  })

  it('只有 READ_ALL 时可访问列表和详情，写操作应返回 403', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const postIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.READ_ALL], roleIds)

      const post = await createPostFixture()
      postIds.push(post.id)

      const listResponse = await user.session.fetcher(createTestRequest('/api/post/'))
      expect(listResponse.status).toBe(200)

      const detailResponse = await user.session.fetcher(createTestRequest(`/api/post/${post.id}`))
      expect(detailResponse.status).toBe(200)

      const createResponse = await requestJson(user.session, '/api/post/', 'POST', {
        title: '受限创建',
        slug: 'read-only-post',
        markdown: '# Read only',
        tags: [],
      })
      await expectErrorResponse(createResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const updateResponse = await requestJson(user.session, `/api/post/${post.id}`, 'PATCH', {
        title: '受限更新',
      })
      await expectErrorResponse(updateResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const deleteResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${post.id}`, {
          method: 'DELETE',
        }),
      )
      await expectErrorResponse(deleteResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })
    } finally {
      await cleanupTestData({ postIds, roleIds, userIds })
    }
  })

  it('只有 WRITE_ALL 时写操作可用，读接口和发布接口应返回 403', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const postIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.WRITE_ALL], roleIds)

      const post = await createPostFixture()
      postIds.push(post.id)

      const createResponse = await requestJson(user.session, '/api/post/', 'POST', {
        title: '可写文章',
        slug: `writable-${createTestSuffix('post')}`,
        markdown: '# Writable',
        tags: [],
      })
      expect(createResponse.status).toBe(200)
      const created = await readJson<Post>(createResponse)
      postIds.push(created.id)

      const updateResponse = await requestJson(user.session, `/api/post/${created.id}`, 'PATCH', {
        title: '已更新',
      })
      expect(updateResponse.status).toBe(200)

      const listResponse = await user.session.fetcher(createTestRequest('/api/post/'))
      await expectErrorResponse(listResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const detailResponse = await user.session.fetcher(createTestRequest(`/api/post/${post.id}`))
      await expectErrorResponse(detailResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const publishResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${post.id}/publish`, {
          method: 'POST',
        }),
      )
      await expectErrorResponse(publishResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const unpublishResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${post.id}/unpublish`, {
          method: 'POST',
        }),
      )
      await expectErrorResponse(unpublishResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })
    } finally {
      await cleanupTestData({ postIds, roleIds, userIds })
    }
  })

  it('只有 PUBLISH_ALL 时发布接口可用，其余接口应返回 403', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const postIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.PUBLISH_ALL], roleIds)

      const post = await createPostFixture()
      postIds.push(post.id)

      const publishResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${post.id}/publish`, {
          method: 'POST',
        }),
      )
      expect(publishResponse.status).toBe(200)

      const unpublishResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${post.id}/unpublish`, {
          method: 'POST',
        }),
      )
      expect(unpublishResponse.status).toBe(200)

      const listResponse = await user.session.fetcher(createTestRequest('/api/post/'))
      await expectErrorResponse(listResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const detailResponse = await user.session.fetcher(createTestRequest(`/api/post/${post.id}`))
      await expectErrorResponse(detailResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const createResponse = await requestJson(user.session, '/api/post/', 'POST', {
        title: '不可创建文章',
        slug: 'cannot-create-post',
        markdown: '# Cannot create',
        tags: [],
      })
      await expectErrorResponse(createResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const updateResponse = await requestJson(user.session, `/api/post/${post.id}`, 'PATCH', {
        title: '不可更新',
      })
      await expectErrorResponse(updateResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })

      const deleteResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${post.id}`, {
          method: 'DELETE',
        }),
      )
      await expectErrorResponse(deleteResponse, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })
    } finally {
      await cleanupTestData({ postIds, roleIds, userIds })
    }
  })

  it('slug 冲突应返回 409', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const postIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.WRITE_ALL], roleIds)

      const suffix = createTestSuffix('post-conflict')
      const post = await createPostFixture({
        suffix,
        data: {
          slug: `post-conflict-${suffix}`,
        },
      })
      postIds.push(post.id)

      const response = await requestJson(user.session, '/api/post/', 'POST', {
        title: '重复文章',
        slug: post.slug,
        markdown: '# 重复文章',
        tags: [],
      })

      await expectErrorResponse(response, {
        status: 409,
        errorCode: 'PRISMA_P2002',
      })
    } finally {
      await cleanupTestData({ postIds, roleIds, userIds })
    }
  })

  it('空更新请求体应返回 422', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const postIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.WRITE_ALL], roleIds)

      const post = await createPostFixture()
      postIds.push(post.id)

      const response = await requestJson(user.session, `/api/post/${post.id}`, 'PATCH', {})

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    } finally {
      await cleanupTestData({ postIds, roleIds, userIds })
    }
  })

  it('标签过长应返回 422', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.WRITE_ALL], roleIds)

      const suffix = createTestSuffix('post-tag')
      const response = await requestJson(user.session, '/api/post/', 'POST', {
        title: `标签文章 ${suffix}`,
        slug: `post-tag-${suffix}`,
        markdown: '# 标签文章',
        tags: ['tag'.repeat(11)],
      })

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    } finally {
      await cleanupTestData({ roleIds, userIds })
    }
  })

  it('列表 query 非法时应返回 422', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.READ_ALL], roleIds)

      const response = await user.session.fetcher(createTestRequest('/api/post/?page=abc'))

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    } finally {
      await cleanupTestData({ roleIds, userIds })
    }
  })

  it('非法 JSON 请求体应返回 400', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.WRITE_ALL], roleIds)

      const response = await user.session.fetcher('http://localhost/api/post/', {
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
      await cleanupTestData({ roleIds, userIds })
    }
  })

  it('详情、更新、删除、发布、取消发布命中不存在文章时应返回 404', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const missingId = createTestSuffix('missing-post')

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(
        user.userId,
        [PostPermissions.READ_ALL, PostPermissions.WRITE_ALL, PostPermissions.PUBLISH_ALL],
        roleIds,
      )

      const detailResponse = await user.session.fetcher(createTestRequest(`/api/post/${missingId}`))
      await expectErrorResponse(detailResponse, {
        status: 404,
        errorCode: 'NOT_FOUND',
      })

      const updateResponse = await requestJson(user.session, `/api/post/${missingId}`, 'PATCH', {
        title: 'missing',
      })
      await expectErrorResponse(updateResponse, {
        status: 404,
        errorCode: 'NOT_FOUND',
      })

      const deleteResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${missingId}`, {
          method: 'DELETE',
        }),
      )
      await expectErrorResponse(deleteResponse, {
        status: 404,
        errorCode: 'NOT_FOUND',
      })

      const publishResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${missingId}/publish`, {
          method: 'POST',
        }),
      )
      await expectErrorResponse(publishResponse, {
        status: 404,
        errorCode: 'NOT_FOUND',
      })

      const unpublishResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${missingId}/unpublish`, {
          method: 'POST',
        }),
      )
      await expectErrorResponse(unpublishResponse, {
        status: 404,
        errorCode: 'NOT_FOUND',
      })
    } finally {
      await cleanupTestData({ roleIds, userIds })
    }
  })

  it('发布前缺少必要内容时应返回 400', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const postIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.PUBLISH_ALL], roleIds)

      const post = await createPostFixture({
        data: {
          markdown: ' ',
        },
      })
      postIds.push(post.id)

      const response = await user.session.fetcher(
        createTestRequest(`/api/post/${post.id}/publish`, {
          method: 'POST',
        }),
      )

      const body = await expectErrorResponse(response, {
        status: 400,
      })
      expect(body.message).toBe('发布前必须填写标题、slug 和 Markdown 内容')
    } finally {
      await cleanupTestData({ postIds, roleIds, userIds })
    }
  })

  it('创建时分类不存在应返回 404', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.WRITE_ALL], roleIds)

      const response = await requestJson(user.session, '/api/post/', 'POST', {
        title: 'missing category',
        slug: `missing-category-${createTestSuffix('post')}`,
        markdown: '# missing category',
        categoryId: createTestSuffix('missing-category'),
        tags: [],
      })

      await expectErrorResponse(response, {
        status: 404,
        message: '分类不存在',
        errorCode: 'NOT_FOUND',
      })
    } finally {
      await cleanupTestData({ roleIds, userIds })
    }
  })

  it('更新时分类不存在应返回 404', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const postIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.WRITE_ALL], roleIds)

      const post = await createPostFixture()
      postIds.push(post.id)

      const response = await requestJson(user.session, `/api/post/${post.id}`, 'PATCH', {
        categoryId: createTestSuffix('missing-category'),
      })

      await expectErrorResponse(response, {
        status: 404,
        message: '分类不存在',
        errorCode: 'NOT_FOUND',
      })
    } finally {
      await cleanupTestData({ postIds, roleIds, userIds })
    }
  })

  it('发布前缺标题应返回 400', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const postIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.PUBLISH_ALL], roleIds)

      const post = await createPostFixture({
        data: {
          title: ' ',
        },
      })
      postIds.push(post.id)

      const response = await user.session.fetcher(
        createTestRequest(`/api/post/${post.id}/publish`, {
          method: 'POST',
        }),
      )

      await expectErrorResponse(response, {
        status: 400,
        message: '发布前必须填写标题、slug 和 Markdown 内容',
      })
    } finally {
      await cleanupTestData({ postIds, roleIds, userIds })
    }
  })

  it('发布前缺 slug 应返回 400', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const postIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.PUBLISH_ALL], roleIds)

      const post = await createPostFixture({
        data: {
          slug: ' ',
        },
      })
      postIds.push(post.id)

      const response = await user.session.fetcher(
        createTestRequest(`/api/post/${post.id}/publish`, {
          method: 'POST',
        }),
      )

      await expectErrorResponse(response, {
        status: 400,
        message: '发布前必须填写标题、slug 和 Markdown 内容',
      })
    } finally {
      await cleanupTestData({ postIds, roleIds, userIds })
    }
  })

  it('重复发布和重复取消发布都应保持幂等', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []
    const postIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.PUBLISH_ALL], roleIds)

      const draftPost = await createPostFixture()
      const publishedPost = await createPostFixture({
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date('2026-05-01T00:00:00.000Z'),
        },
      })
      postIds.push(draftPost.id, publishedPost.id)

      const firstPublishResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${draftPost.id}/publish`, {
          method: 'POST',
        }),
      )
      const firstPublish = await readJson<Post>(firstPublishResponse)

      const secondPublishResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${draftPost.id}/publish`, {
          method: 'POST',
        }),
      )
      expect(secondPublishResponse.status).toBe(200)
      const secondPublish = await readJson<Post>(secondPublishResponse)
      expect(secondPublish.status).toBe('published')
      expect(secondPublish.publishedAt).toBe(firstPublish.publishedAt)

      const firstUnpublishResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${publishedPost.id}/unpublish`, {
          method: 'POST',
        }),
      )
      expect(firstUnpublishResponse.status).toBe(200)
      const firstUnpublish = await readJson<Post>(firstUnpublishResponse)
      expect(firstUnpublish.status).toBe('draft')
      expect(firstUnpublish.publishedAt).toBeNull()

      const secondUnpublishResponse = await user.session.fetcher(
        createTestRequest(`/api/post/${publishedPost.id}/unpublish`, {
          method: 'POST',
        }),
      )
      expect(secondUnpublishResponse.status).toBe(200)
      const secondUnpublish = await readJson<Post>(secondUnpublishResponse)
      expect(secondUnpublish.status).toBe('draft')
      expect(secondUnpublish.publishedAt).toBeNull()
    } finally {
      await cleanupTestData({ postIds, roleIds, userIds })
    }
  })
})
