import type { Comment, CommentList } from './model'

import {
  createCommentFixture,
  createIntegrationTestContext,
  createPostFixture,
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

afterEach(async () => {
  await integration.cleanup()
})

describe('comment routes', () => {
  it('匿名创建评论时状态为 pending', async () => {
    const post = await createPublishedPost()

    const { response, body } = await requestJson<Comment>('/api/comment', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        postId: post.id,
        authorName: '喜东东',
        authorEmail: 'xdd@example.com',
        content: '匿名评论内容',
      }),
    })

    expect(response.status).toBe(200)
    expect(body.status).toBe('pending')
    expect(body.postId).toBe(post.id)
    integration.track.commentId(body.id)
  })

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

  it('后台列表和详情需要读取权限', async () => {
    const post = await createPublishedPost()
    const comment = await createCommentFixture(post.id, {
      data: {
        status: 'APPROVED',
      },
    })
    integration.track.commentId(comment.id)

    await expectErrorResponse(await anonymousRunner('/api/comment'), { status: 401 })

    const forbiddenRunner = await createActor([])
    await expectErrorResponse(await forbiddenRunner('/api/comment'), { status: 403, message: '权限不足' })
    await expectErrorResponse(await forbiddenRunner(`/api/comment/${comment.id}`), {
      status: 403,
      message: '权限不足',
    })

    const readRunner = await createActor([CommentPermissions.READ_ALL])
    const { response, body } = await requestJson<Comment>(`/api/comment/${comment.id}`, {}, readRunner)

    expect(response.status).toBe(200)
    expect(body.id).toBe(comment.id)
  })

  it('读取不存在评论应返回 404', async () => {
    const readRunner = await createActor([CommentPermissions.READ_ALL])

    await expectErrorResponse(await readRunner('/api/comment/missing-comment-id'), {
      status: 404,
      message: '评论不存在',
    })
  })

  it('可以更新评论状态', async () => {
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
    expect(body.id).toBe(comment.id)
    expect(body.status).toBe('approved')
  })

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
      await moderateRunner(`/api/comment/${comment.id}/status`, {
        method: 'PATCH',
        headers: jsonHeaders(),
        body: JSON.stringify({
          status: 'deleted',
        }),
      }),
      { status: 422, errorCode: 'VALIDATION' },
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

    const { response, body } = await requestJson<CommentList>('/api/comment?page=1&pageSize=20', {}, runner)

    expect(response.status).toBe(200)
    expect(body.items.some((item) => item.id === visibleComment.id)).toBe(true)
    expect(body.items.some((item) => item.id === deletedComment.id)).toBe(false)
  })
})
