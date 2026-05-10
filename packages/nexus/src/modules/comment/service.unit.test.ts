import type { CommentBaseData } from './types'

import { afterEach, describe, expect, it, spyOn } from 'bun:test'

import { CommentRepository } from './repository'
import { CommentService } from './service'

function createComment(overrides: Partial<CommentBaseData> = {}): CommentBaseData {
  return {
    id: 'comment-1',
    postId: 'post-1',
    authorName: 'xdd',
    authorEmail: 'test@example.com',
    content: 'test comment content',
    status: 'APPROVED',
    createdAt: new Date('2026-04-30T00:00:00.000Z'),
    updatedAt: new Date('2026-04-30T00:00:00.000Z'),
    ...overrides,
  }
}

describe('CommentService', () => {
  afterEach(() => {
    spyOn(CommentRepository, 'paginate').mockRestore()
    spyOn(CommentRepository, 'create').mockRestore()
    spyOn(CommentRepository, 'findById').mockRestore()
    spyOn(CommentRepository, 'updateStatus').mockRestore()
    spyOn(CommentRepository, 'publishedPostExists').mockRestore()
  })

  it('默认列表不返回已删除评论', async () => {
    const paginateSpy = spyOn(CommentRepository, 'paginate').mockResolvedValue({
      items: [createComment()],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    })

    const result = await CommentService.list({ page: 1, pageSize: 20 })

    expect(paginateSpy).toHaveBeenCalledWith({ status: { not: 'DELETED' } }, { page: 1, pageSize: 20 })
    expect(result.items[0]?.status).toBe('approved')
  })

  it('按状态、文章、关键词和时间组装列表条件', async () => {
    const paginateSpy = spyOn(CommentRepository, 'paginate').mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      pageSize: 10,
      totalPages: 0,
    })

    await CommentService.list({
      page: 2,
      pageSize: 10,
      status: 'hidden',
      postId: 'post-1',
      keyword: 'hello',
      createdFrom: '2026-04-01T00:00:00.000Z',
      createdTo: '2026-04-30T00:00:00.000Z',
    })

    expect(paginateSpy).toHaveBeenCalledWith(
      {
        status: 'HIDDEN',
        postId: 'post-1',
        createdAt: {
          gte: new Date('2026-04-01T00:00:00.000Z'),
          lte: new Date('2026-04-30T00:00:00.000Z'),
        },
        OR: [
          {
            authorName: {
              contains: 'hello',
              mode: 'insensitive',
            },
          },
          {
            authorEmail: {
              contains: 'hello',
              mode: 'insensitive',
            },
          },
          {
            content: {
              contains: 'hello',
              mode: 'insensitive',
            },
          },
        ],
      },
      {
        page: 2,
        pageSize: 10,
        status: 'hidden',
        postId: 'post-1',
        keyword: 'hello',
        createdFrom: '2026-04-01T00:00:00.000Z',
        createdTo: '2026-04-30T00:00:00.000Z',
      },
    )
  })

  it('可以完整创建评论', async () => {
    spyOn(CommentRepository, 'publishedPostExists').mockResolvedValue(true)
    const createSpy = spyOn(CommentRepository, 'create').mockResolvedValue(createComment())

    const result = await CommentService.create({
      postId: 'post-1',
      authorName: 'xdd',
      authorEmail: 'test@example.com',
      content: 'test comment content',
    })

    expect(createSpy).toHaveBeenCalledWith({
      postId: 'post-1',
      authorName: 'xdd',
      authorEmail: 'test@example.com',
      content: 'test comment content',
    })
    expect(result.id).toBe('comment-1')
    expect(result.content).toBe('test comment content')
  })

  it('创建评论时文章不存在或未发布应抛错', async () => {
    spyOn(CommentRepository, 'publishedPostExists').mockResolvedValue(false)
    const createSpy = spyOn(CommentRepository, 'create').mockResolvedValue(createComment())

    await expect(
      CommentService.create({
        postId: 'post-1',
        authorName: 'xdd',
        authorEmail: null,
        content: 'test comment content',
      }),
    ).rejects.toThrow('文章不存在或未发布')
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('查看指定评论', async () => {
    const findSpy = spyOn(CommentRepository, 'findById').mockResolvedValue(createComment())

    const result = await CommentService.findById('comment-1')

    expect(findSpy).toHaveBeenCalledWith('comment-1')
    expect(result.id).toBe('comment-1')
  })

  it('查看不存在评论应抛错', async () => {
    spyOn(CommentRepository, 'findById').mockResolvedValue(null)

    await expect(CommentService.findById('missing')).rejects.toThrow('评论不存在')
  })

  it('更改评论状态', async () => {
    spyOn(CommentRepository, 'findById').mockResolvedValue(createComment({ status: 'PENDING' }))
    const updateSpy = spyOn(CommentRepository, 'updateStatus').mockResolvedValue(createComment({ status: 'HIDDEN' }))

    const result = await CommentService.updateStatus('comment-1', 'hidden')

    expect(updateSpy).toHaveBeenCalledWith('comment-1', 'HIDDEN')
    expect(result.status).toBe('hidden')
  })

  it('状态未变化时直接返回当前评论', async () => {
    spyOn(CommentRepository, 'findById').mockResolvedValue(createComment({ status: 'APPROVED' }))
    const updateSpy = spyOn(CommentRepository, 'updateStatus').mockResolvedValue(createComment({ status: 'HIDDEN' }))

    const result = await CommentService.updateStatus('comment-1', 'approved')

    expect(updateSpy).not.toHaveBeenCalled()
    expect(result.status).toBe('approved')
  })

  it('已删除评论不能再修改状态', async () => {
    spyOn(CommentRepository, 'findById').mockResolvedValue(createComment({ status: 'DELETED' }))
    const updateSpy = spyOn(CommentRepository, 'updateStatus').mockResolvedValue(createComment({ status: 'HIDDEN' }))

    await expect(CommentService.updateStatus('comment-1', 'hidden')).rejects.toThrow('已删除评论不能再修改状态')
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('删除评论', async () => {
    spyOn(CommentRepository, 'findById').mockResolvedValue(createComment())
    const updateStatusSpy = spyOn(CommentRepository, 'updateStatus').mockResolvedValue(
      createComment({ status: 'DELETED' }),
    )

    await CommentService.remove('comment-1')

    expect(updateStatusSpy).toHaveBeenCalledWith('comment-1', 'DELETED')
  })

  it('删除已删除评论时不重复写入', async () => {
    spyOn(CommentRepository, 'findById').mockResolvedValue(createComment({ status: 'DELETED' }))
    const updateStatusSpy = spyOn(CommentRepository, 'updateStatus').mockResolvedValue(
      createComment({ status: 'DELETED' }),
    )

    await CommentService.remove('comment-1')

    expect(updateStatusSpy).not.toHaveBeenCalled()
  })

  it('删除不存在的评论应抛错', async () => {
    spyOn(CommentRepository, 'findById').mockResolvedValue(null)
    const updateStatusSpy = spyOn(CommentRepository, 'updateStatus').mockResolvedValue(
      createComment({ status: 'DELETED' }),
    )

    await expect(CommentService.remove('missing')).rejects.toThrow('评论不存在')
    expect(updateStatusSpy).not.toHaveBeenCalled()
  })
})
