import type { Prisma } from '@nexus/infra/database/client'
import type { PostBaseData } from './types'
import { describe, expect, it, mock } from 'bun:test'
import { PostRepository } from './repository'

function createPost(overrides: Partial<PostBaseData> = {}): PostBaseData {
  return {
    id: 'post-1',
    title: 'Post',
    slug: 'post',
    markdown: '# Post',
    excerpt: null,
    coverImage: null,
    status: 'DRAFT',
    categoryId: null,
    category: null,
    tags: [],
    publishedAt: null,
    createdAt: new Date('2026-04-30T00:00:00.000Z'),
    updatedAt: new Date('2026-04-30T00:00:00.000Z'),
    ...overrides,
  }
}

describe('PostRepository client injection', () => {
  it('实例方法应调用构造函数传入的 Prisma client', async () => {
    const post = createPost()
    const findUnique = mock(async () => post)
    const repository = new PostRepository({
      post: {
        findUnique,
      },
    } as unknown as Pick<Prisma, 'post'>)

    const result = await repository.findById('post-1')

    expect(result).toBe(post)
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      select: expect.any(Object),
    })
  })
})
