import type { PostBaseData } from './types'
import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import { CategoryRepository } from '../category'
import { PostRepository } from './repository'
import { PostService } from './service'

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

describe('PostService category', () => {
  afterEach(() => {
    spyOn(CategoryRepository, 'findById').mockRestore()
    spyOn(PostRepository, 'create').mockRestore()
    spyOn(PostRepository, 'findById').mockRestore()
    spyOn(PostRepository, 'paginate').mockRestore()
    spyOn(PostRepository, 'update').mockRestore()
  })

  it('创建文章时应拒绝不存在的分类', async () => {
    spyOn(CategoryRepository, 'findById').mockResolvedValue(null)
    const createSpy = spyOn(PostRepository, 'create').mockResolvedValue(createPost())

    await expect(
      PostService.create({
        title: 'Post',
        slug: 'post',
        markdown: '# Post',
        categoryId: 'missing-category',
        tags: [],
      }),
    ).rejects.toThrow('分类不存在')
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('更新文章时应拒绝不存在的分类', async () => {
    spyOn(PostRepository, 'findById').mockResolvedValue(createPost())
    spyOn(CategoryRepository, 'findById').mockResolvedValue(null)
    const updateSpy = spyOn(PostRepository, 'update').mockResolvedValue(createPost())

    await expect(
      PostService.update('post-1', {
        categoryId: 'missing-category',
      }),
    ).rejects.toThrow('分类不存在')
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('列表应支持按 categorySlug 查询', async () => {
    const paginateSpy = spyOn(PostRepository, 'paginate').mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    })

    await PostService.list({
      page: 1,
      pageSize: 20,
      categorySlug: 'engineering',
    })

    expect(paginateSpy).toHaveBeenCalledWith(
      {
        category: {
          slug: 'engineering',
        },
      },
      {
        page: 1,
        pageSize: 20,
        categorySlug: 'engineering',
      },
    )
  })
})
