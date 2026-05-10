import type { Comment, CommentList } from './model'

import {
  createCommentFixture,
  createIntegrationTestContext,
  createPostFixture,
  createTestSuffix,
  expectDateTime,
  expectErrorResponse,
  expectNoBody,
} from '@nexus/test'

import { afterEach, describe, expect, it } from 'bun:test'

import { CommentPermissions } from './permissions'

const integration = createIntegrationTestContext({
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

const anonymousRunner = integration.anonymous
const jsonHeaders = integration.jsonHeaders
const createActor = integration.actor

async function createPublishedPost() {
  const post = await createPostFixture({
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date('2026-05-01T00:00:00.000Z'),
    },
  })
  integration.track.postId(post.id)
  return post
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
  runner = anonymousRunner,
): Promise<{ body: T; response: Response }> {
  return await integration.json<T>(path, init, runner)
}

function expectCommentContract(
  comment: Comment,
  expected: {
    id?: string
    postId?: string
    authorName?: string
    authorEmail?: string | null
    content?: string
    status?: 'pending' | 'approved' | 'hidden' | 'deleted'
  } = {},
) {
  expect(typeof comment.id).toBe('string')
  expect(comment.id.length).toBeGreaterThan(0)
  expect(typeof comment.postId).toBe('string')
  expect(typeof comment.authorName).toBe('string')
  expect(typeof comment.content).toBe('string')
  expect(['pending', 'approved', 'hidden', 'deleted']).toContain(comment.status)
  expectDateTime(comment.createdAt)
  expectDateTime(comment.updatedAt)

  if (expected.id !== undefined) {
    expect(comment.id).toBe(expected.id)
  }
  if (expected.postId !== undefined) {
    expect(comment.postId).toBe(expected.postId)
  }
  if (expected.authorName !== undefined) {
    expect(comment.authorName).toBe(expected.authorName)
  }
  if (expected.authorEmail !== undefined) {
    expect(comment.authorEmail).toBe(expected.authorEmail)
  }
  if (expected.content !== undefined) {
    expect(comment.content).toBe(expected.content)
  }
  if (expected.status !== undefined) {
    expect(comment.status).toBe(expected.status)
  }
}

function expectCommentListContract(
  list: CommentList,
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

afterEach(async () => {
  await integration.cleanup()
})

describe('comment routes', () => {
  describe('评论创建与列表', () => {
    it('匿名创建评论时状态为 pending，并返回完整字段契约', async () => {
      const post = await createPublishedPost()
      const payload = {
        postId: post.id,
        authorName: '喜东东',
        authorEmail: 'xdd@example.com',
        content: '匿名评论内容',
      }

      const { response, body } = await requestJson<Comment>('/api/comment', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
      })

      expect(response.status).toBe(200)
      integration.track.commentId(body.id)
      expectCommentContract(body, {
        postId: post.id,
        authorName: payload.authorName,
        authorEmail: payload.authorEmail,
        content: payload.content,
        status: 'pending',
      })
    })

    it('后台列表和详情需要读取权限，并返回分页和评论契约', async () => {
      const post = await createPublishedPost()
      const comment = await createCommentFixture(post.id, {
        data: {
          status: 'APPROVED',
        },
      })
      integration.track.commentId(comment.id)

      await expectErrorResponse(await anonymousRunner('/api/comment'), { status: 401 })

      const forbiddenRunner = await createActor([])
      await expectErrorResponse(await forbiddenRunner('/api/comment'), {
        status: 403,
        message: '权限不足',
      })
      await expectErrorResponse(await forbiddenRunner(`/api/comment/${comment.id}`), {
        status: 403,
        message: '权限不足',
      })

      const readRunner = await createActor([CommentPermissions.READ_ALL])
      const listResult = await requestJson<CommentList>(
        `/api/comment?page=1&pageSize=20&postId=${post.id}&status=approved`,
        {},
        readRunner,
      )

      expect(listResult.response.status).toBe(200)
      expectCommentListContract(listResult.body, {
        page: 1,
        pageSize: 20,
      })
      const listed = listResult.body.items.find((item) => item.id === comment.id)
      expect(listed).toBeDefined()
      expectCommentContract(listed!, {
        id: comment.id,
        postId: post.id,
        authorName: comment.authorName,
        authorEmail: comment.authorEmail,
        content: comment.content,
        status: 'approved',
      })

      const detailResult = await requestJson<Comment>(`/api/comment/${comment.id}`, {}, readRunner)
      expect(detailResult.response.status).toBe(200)
      expectCommentContract(detailResult.body, {
        id: comment.id,
        postId: post.id,
        authorName: comment.authorName,
        authorEmail: comment.authorEmail,
        content: comment.content,
        status: 'approved',
      })
    })

    it('已删除评论默认不在列表中', async () => {
      const post = await createPublishedPost()
      const visibleComment = await createCommentFixture(post.id, {
        data: {
          content: 'visible comment',
          status: 'APPROVED',
        },
      })
      const deletedComment = await createCommentFixture(post.id, {
        data: {
          content: 'deleted comment',
          status: 'DELETED',
        },
      })
      integration.track.commentId(visibleComment.id)
      integration.track.commentId(deletedComment.id)
      const runner = await createActor([CommentPermissions.READ_ALL])

      const { response, body } = await requestJson<CommentList>(
        '/api/comment?page=1&pageSize=20',
        {},
        runner,
      )

      expect(response.status).toBe(200)
      expectCommentListContract(body, {
        page: 1,
        pageSize: 20,
      })
      expect(body.items.some((item) => item.id === visibleComment.id)).toBe(true)
      expect(body.items.some((item) => item.id === deletedComment.id)).toBe(false)
    })

    it('无匹配评论时应返回空结果和分页元信息', async () => {
      const runner = await createActor([CommentPermissions.READ_ALL])
      const { response, body } = await requestJson<CommentList>(
        `/api/comment?page=1&pageSize=10&keyword=${createTestSuffix('no-comment-match')}`,
        {},
        runner,
      )

      expect(response.status).toBe(200)
      expectCommentListContract(body, {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      })
      expect(body.items).toEqual([])
    })
  })

  describe('状态修改', () => {
    it('可以更新评论状态，并返回更新时间和状态契约', async () => {
      const post = await createPublishedPost()
      const comment = await createCommentFixture(post.id)
      integration.track.commentId(comment.id)
      const runner = await createActor([CommentPermissions.MODERATE_ALL])

      const { response, body } = await requestJson<Comment>(
        `/api/comment/${comment.id}/status`,
        {
          method: 'PATCH',
          headers: jsonHeaders(),
          body: JSON.stringify({
            status: 'approved',
          }),
        },
        runner,
      )

      expect(response.status).toBe(200)
      expectCommentContract(body, {
        id: comment.id,
        postId: post.id,
        authorName: comment.authorName,
        authorEmail: comment.authorEmail,
        content: comment.content,
        status: 'approved',
      })
    })

    it('重复设置相同状态应保持幂等', async () => {
      const post = await createPublishedPost()
      const comment = await createCommentFixture(post.id, {
        data: {
          status: 'APPROVED',
        },
      })
      integration.track.commentId(comment.id)
      const runner = await createActor([CommentPermissions.MODERATE_ALL])

      const { response, body } = await requestJson<Comment>(
        `/api/comment/${comment.id}/status`,
        {
          method: 'PATCH',
          headers: jsonHeaders(),
          body: JSON.stringify({
            status: 'approved',
          }),
        },
        runner,
      )

      expect(response.status).toBe(200)
      expectCommentContract(body, {
        id: comment.id,
        postId: post.id,
        authorName: comment.authorName,
        authorEmail: comment.authorEmail,
        content: comment.content,
        status: 'approved',
      })
    })
  })

  describe('删除', () => {
    it('删除评论返回 204 空 body', async () => {
      const post = await createPublishedPost()
      const comment = await createCommentFixture(post.id)
      integration.track.commentId(comment.id)
      const runner = await createActor([CommentPermissions.MODERATE_ALL])

      const response = await runner(`/api/comment/${comment.id}`, {
        method: 'DELETE',
      })

      await expectNoBody(response)
    })

    it('重复删除评论仍返回 204 空 body', async () => {
      const post = await createPublishedPost()
      const comment = await createCommentFixture(post.id, {
        data: {
          status: 'DELETED',
        },
      })
      integration.track.commentId(comment.id)
      const runner = await createActor([CommentPermissions.MODERATE_ALL])

      const response = await runner(`/api/comment/${comment.id}`, {
        method: 'DELETE',
      })

      await expectNoBody(response)
    })
  })

  describe('权限边界', () => {
    it('更新评论状态失败时返回对应状态码', async () => {
      const post = await createPublishedPost()
      const comment = await createCommentFixture(post.id)
      const deletedComment = await createCommentFixture(post.id, {
        data: {
          status: 'DELETED',
        },
      })
      integration.track.commentId(comment.id)
      integration.track.commentId(deletedComment.id)

      await expectErrorResponse(
        await anonymousRunner(`/api/comment/${comment.id}/status`, {
          method: 'PATCH',
          headers: jsonHeaders(),
          body: JSON.stringify({
            status: 'approved',
          }),
        }),
        { status: 401 },
      )

      const forbiddenRunner = await createActor([CommentPermissions.READ_ALL])
      await expectErrorResponse(
        await forbiddenRunner(`/api/comment/${comment.id}/status`, {
          method: 'PATCH',
          headers: jsonHeaders(),
          body: JSON.stringify({
            status: 'approved',
          }),
        }),
        { status: 403, message: '权限不足' },
      )

      const moderateRunner = await createActor([CommentPermissions.MODERATE_ALL])
      await expectErrorResponse(
        await moderateRunner('/api/comment/missing-comment-id/status', {
          method: 'PATCH',
          headers: jsonHeaders(),
          body: JSON.stringify({
            status: 'approved',
          }),
        }),
        { status: 404, message: '评论不存在' },
      )
      await expectErrorResponse(
        await moderateRunner(`/api/comment/${deletedComment.id}/status`, {
          method: 'PATCH',
          headers: jsonHeaders(),
          body: JSON.stringify({
            status: 'approved',
          }),
        }),
        { status: 400, message: '已删除评论不能再修改状态' },
      )
    })

    it('删除评论失败时返回对应状态码', async () => {
      const post = await createPublishedPost()
      const comment = await createCommentFixture(post.id)
      integration.track.commentId(comment.id)

      await expectErrorResponse(
        await anonymousRunner(`/api/comment/${comment.id}`, {
          method: 'DELETE',
        }),
        { status: 401 },
      )

      const forbiddenRunner = await createActor([CommentPermissions.READ_ALL])
      await expectErrorResponse(
        await forbiddenRunner(`/api/comment/${comment.id}`, {
          method: 'DELETE',
        }),
        { status: 403, message: '权限不足' },
      )

      const moderateRunner = await createActor([CommentPermissions.MODERATE_ALL])
      await expectErrorResponse(
        await moderateRunner('/api/comment/missing-comment-id', {
          method: 'DELETE',
        }),
        { status: 404, message: '评论不存在' },
      )
    })
  })

  describe('非法输入', () => {
    it('匿名创建未发布文章评论应返回 404', async () => {
      const post = await createPostFixture({
        data: {
          status: 'DRAFT',
        },
      })
      integration.track.postId(post.id)

      const response = await anonymousRunner('/api/comment', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({
          postId: post.id,
          authorName: '喜东东',
          content: '草稿文章评论',
        }),
      })

      await expectErrorResponse(response, { status: 404, message: '文章不存在或未发布' })
    })

    it('匿名创建非法评论应返回 422', async () => {
      const response = await anonymousRunner('/api/comment', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({
          postId: '',
          authorName: '',
          content: '',
        }),
      })

      await expectErrorResponse(response, { status: 422, errorCode: 'VALIDATION' })
    })

    it('读取不存在评论应返回 404', async () => {
      const readRunner = await createActor([CommentPermissions.READ_ALL])

      await expectErrorResponse(await readRunner('/api/comment/missing-comment-id'), {
        status: 404,
        message: '评论不存在',
      })
    })

    it('更新评论状态为非法枚举值应返回 422', async () => {
      const post = await createPublishedPost()
      const comment = await createCommentFixture(post.id)
      integration.track.commentId(comment.id)
      const moderateRunner = await createActor([CommentPermissions.MODERATE_ALL])

      await expectErrorResponse(
        await moderateRunner(`/api/comment/${comment.id}/status`, {
          method: 'PATCH',
          headers: jsonHeaders(),
          body: JSON.stringify({
            status: 'deleted',
          }),
        }),
        { status: 422, errorCode: 'VALIDATION' },
      )
    })

    it('列表 query 非法时应返回 422', async () => {
      const readRunner = await createActor([CommentPermissions.READ_ALL])

      await expectErrorResponse(await readRunner('/api/comment?createdFrom=2026-05-02T00:00:00.000Z&createdTo=2026-05-01T00:00:00.000Z'), {
        status: 422,
        errorCode: 'VALIDATION',
      })
    })
  })
})
