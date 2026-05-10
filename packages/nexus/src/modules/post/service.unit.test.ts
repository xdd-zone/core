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
    spyOn(PostRepository, 'delete').mockRestore()
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

  it('列表应支持状态、分类、标签和关键字查询', async () => {
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
      status: 'published',
      categoryId: 'category-1',
      tag: 'Elysia',
      keyword: '测试',
    })

    expect(paginateSpy).toHaveBeenCalledWith(
      {
        status: 'PUBLISHED',
        categoryId: 'category-1',
        tags: {
          has: 'Elysia',
        },
        OR: [
          {
            title: {
              contains: '测试',
              mode: 'insensitive',
            },
          },
          {
            slug: {
              contains: '测试',
              mode: 'insensitive',
            },
          },
          {
            excerpt: {
              contains: '测试',
              mode: 'insensitive',
            },
          },
        ],
      },
      {
        page: 1,
        pageSize: 20,
        status: 'published',
        categoryId: 'category-1',
        tag: 'Elysia',
        keyword: '测试',
      },
    )
  })

  it('删除不存在文章应报错', async () => {
    spyOn(PostRepository, 'findById').mockResolvedValue(null)
    const deleteSpy = spyOn(PostRepository, 'delete').mockResolvedValue(createPost())

    await expect(PostService.remove('missing')).rejects.toThrow('文章不存在')
    expect(deleteSpy).not.toHaveBeenCalled()
  })

  it('发布草稿文章时应写入发布时间', async () => {
    spyOn(PostRepository, 'findById').mockResolvedValue(createPost())
    const updateSpy = spyOn(PostRepository, 'update').mockResolvedValue(
      createPost({
        status: 'PUBLISHED',
        publishedAt: new Date('2026-05-01T00:00:00.000Z'),
      }),
    )

    const result = await PostService.publish('post-1')

    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(updateSpy.mock.calls[0]?.[0]).toBe('post-1')
    expect(updateSpy.mock.calls[0]?.[1].status).toBe('PUBLISHED')
    expect(updateSpy.mock.calls[0]?.[1].publishedAt).toBeInstanceOf(Date)
    expect(result.status).toBe('published')
  })

  it('已发布文章再次发布时不重复更新', async () => {
    spyOn(PostRepository, 'findById').mockResolvedValue(
      createPost({
        status: 'PUBLISHED',
        publishedAt: new Date('2026-05-01T00:00:00.000Z'),
      }),
    )
    const updateSpy = spyOn(PostRepository, 'update').mockResolvedValue(createPost())

    const result = await PostService.publish('post-1')

    expect(updateSpy).not.toHaveBeenCalled()
    expect(result.status).toBe('published')
  })

  it('发布前缺少必要内容应报错', async () => {
    spyOn(PostRepository, 'findById').mockResolvedValue(
      createPost({
        markdown: ' ',
      }),
    )
    const updateSpy = spyOn(PostRepository, 'update').mockResolvedValue(createPost())

    await expect(PostService.publish('post-1')).rejects.toThrow('发布前必须填写标题、slug 和 Markdown 内容')
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('取消发布应回到草稿并清空发布时间', async () => {
    spyOn(PostRepository, 'findById').mockResolvedValue(
      createPost({
        status: 'PUBLISHED',
        publishedAt: new Date('2026-05-01T00:00:00.000Z'),
      }),
    )
    const updateSpy = spyOn(PostRepository, 'update').mockResolvedValue(createPost())

    const result = await PostService.unpublish('post-1')

    expect(updateSpy).toHaveBeenCalledWith('post-1', {
      status: 'DRAFT',
      publishedAt: null,
    })
    expect(result.status).toBe('draft')
    expect(result.publishedAt).toBeNull()
  })
})
