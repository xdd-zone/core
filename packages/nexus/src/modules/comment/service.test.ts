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
    spyOn(CommentRepository, 'create').mockRestore()
    spyOn(CommentRepository, 'findById').mockRestore()
    spyOn(CommentRepository, 'updateStatus').mockRestore()
    spyOn(CommentRepository, 'publishedPostExists').mockRestore()
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

  it('查看指定评论', async () => {
    const findSpy = spyOn(CommentRepository, 'findById').mockResolvedValue(createComment())

    const result = await CommentService.findById('comment-1')

    expect(findSpy).toHaveBeenCalledWith('comment-1')
    expect(result.id).toBe('comment-1')
  })

  it('更改评论状态', async () => {
    spyOn(CommentRepository, 'findById').mockResolvedValue(createComment({ status: 'PENDING' }))
    const updateSpy = spyOn(CommentRepository, 'updateStatus').mockResolvedValue(createComment({ status: 'HIDDEN' }))

    const result = await CommentService.updateStatus('comment-1', 'hidden')

    expect(updateSpy).toHaveBeenCalledWith('comment-1', 'HIDDEN')
    expect(result.status).toBe('hidden')
  })

  it('删除评论', async () => {
    spyOn(CommentRepository, 'findById').mockResolvedValue(createComment())
    const updateStatusSpy = spyOn(CommentRepository, 'updateStatus').mockResolvedValue(
      createComment({ status: 'DELETED' }),
    )

    await CommentService.remove('comment-1')

    expect(updateStatusSpy).toHaveBeenCalledWith('comment-1', 'DELETED')
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
