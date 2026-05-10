import type { CategoryBaseData } from './types'
import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import { CategoryRepository } from './repository'
import { CategoryService } from './service'

function createCategory(overrides: Partial<CategoryBaseData> = {}): CategoryBaseData {
  return {
    id: 'category-1',
    name: '测试',
    slug: 'category-ll7-rmd',
    description: null,
    sortOrder: 0,
    isVisible: true,
    createdAt: new Date('2026-04-30T00:00:00.000Z'),
    updatedAt: new Date('2026-04-30T00:00:00.000Z'),
    _count: {
      posts: 3,
    },
    ...overrides,
  }
}

describe('CategoryService', () => {
  afterEach(() => {
    spyOn(CategoryRepository, 'countPublishedPosts').mockRestore()
    spyOn(CategoryRepository, 'create').mockRestore()
    spyOn(CategoryRepository, 'delete').mockRestore()
    spyOn(CategoryRepository, 'findById').mockRestore()
    spyOn(CategoryRepository, 'paginate').mockRestore()
    spyOn(CategoryRepository, 'update').mockRestore()
  })

  it('创建分类未传 slug 时应生成合法 slug', async () => {
    const createSpy = spyOn(CategoryRepository, 'create').mockResolvedValue(createCategory())
    spyOn(CategoryRepository, 'countPublishedPosts').mockResolvedValue(new Map([['category-1', 2]]))

    const result = await CategoryService.create({
      name: '测试',
      description: null,
    })

    expect(createSpy).toHaveBeenCalledWith({
      name: '测试',
      slug: 'category-ll7-rmd',
      description: null,
      sortOrder: 0,
      isVisible: true,
    })
    expect(result.slug).toBe('category-ll7-rmd')
    expect(result.postCount).toBe(3)
    expect(result.publishedPostCount).toBe(2)
  })

  it('更新分类传非法 slug 时应改成合法 slug', async () => {
    spyOn(CategoryRepository, 'findById').mockResolvedValue(createCategory())
    const updateSpy = spyOn(CategoryRepository, 'update').mockResolvedValue(
      createCategory({
        name: '中文分类',
        slug: 'category-19',
      }),
    )
    spyOn(CategoryRepository, 'countPublishedPosts').mockResolvedValue(new Map())

    const result = await CategoryService.update('category-1', {
      name: '中文分类',
      slug: '-',
    })

    expect(updateSpy).toHaveBeenCalledWith('category-1', {
      name: '中文分类',
      slug: 'category-19',
      description: undefined,
      sortOrder: undefined,
      isVisible: undefined,
    })
    expect(result.slug).toBe('category-19')
  })

  it('列表应返回文章总数和已发布文章数', async () => {
    spyOn(CategoryRepository, 'paginate').mockResolvedValue({
      items: [createCategory()],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    })
    spyOn(CategoryRepository, 'countPublishedPosts').mockResolvedValue(new Map([['category-1', 2]]))

    const result = await CategoryService.list({
      page: 1,
      pageSize: 20,
    })

    expect(result.items[0]?.postCount).toBe(3)
    expect(result.items[0]?.publishedPostCount).toBe(2)
  })

  it('列表应按关键字和可见状态构建查询条件', async () => {
    const paginateSpy = spyOn(CategoryRepository, 'paginate').mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    })
    spyOn(CategoryRepository, 'countPublishedPosts').mockResolvedValue(new Map())

    await CategoryService.list({
      page: 1,
      pageSize: 20,
      keyword: '工程',
      isVisible: false,
    })

    expect(paginateSpy).toHaveBeenCalledWith(
      {
        isVisible: false,
        OR: [
          {
            name: {
              contains: '工程',
              mode: 'insensitive',
            },
          },
          {
            slug: {
              contains: '工程',
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: '工程',
              mode: 'insensitive',
            },
          },
        ],
      },
      {
        page: 1,
        pageSize: 20,
        keyword: '工程',
        isVisible: false,
      },
    )
  })

  it('删除不存在分类应报错', async () => {
    spyOn(CategoryRepository, 'findById').mockResolvedValue(null)
    const deleteSpy = spyOn(CategoryRepository, 'delete').mockResolvedValue(createCategory())

    await expect(CategoryService.remove('missing')).rejects.toThrow('分类不存在')
    expect(deleteSpy).not.toHaveBeenCalled()
  })

  it('查询不存在分类应报错', async () => {
    spyOn(CategoryRepository, 'findById').mockResolvedValue(null)

    await expect(CategoryService.findById('missing')).rejects.toThrow('分类不存在')
  })
})
