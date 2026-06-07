import type { ContentStatus } from '@nexus-prisma/generated/client'
import type { PaginatedList, PaginationQuery } from '@nexus/infra/database'
import type { Prisma } from '@nexus/infra/database/client'
import type { PostBaseData, PostWhereInput } from './types'
import { calculateSkip, createPaginatedResponse, normalizePagination, prisma } from '@nexus/infra/database'
import { POST_BASE_SELECT } from './constants'

type PostRepositoryClient = Pick<Prisma, 'post'>

/**
 * 文章仓储类。
 */
export class PostRepository {
  private static readonly defaultRepository = new PostRepository()

  constructor(private readonly client: PostRepositoryClient = prisma) {}

  /**
   * 分页查询文章。
   */
  static async paginate(where: PostWhereInput, query: PaginationQuery): Promise<PaginatedList<PostBaseData>> {
    return PostRepository.defaultRepository.paginate(where, query)
  }

  async paginate(where: PostWhereInput, query: PaginationQuery): Promise<PaginatedList<PostBaseData>> {
    const { page, pageSize } = normalizePagination(query)
    const skip = calculateSkip(page, pageSize)

    const [total, items] = await Promise.all([
      this.client.post.count({ where }),
      this.client.post.findMany({
        where,
        skip,
        take: pageSize,
        select: POST_BASE_SELECT,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      }),
    ])

    return createPaginatedResponse(items, total, page, pageSize)
  }

  /**
   * 根据 ID 查询文章。
   */
  static async findById(id: string): Promise<PostBaseData | null> {
    return PostRepository.defaultRepository.findById(id)
  }

  async findById(id: string): Promise<PostBaseData | null> {
    return this.client.post.findUnique({
      where: { id },
      select: POST_BASE_SELECT,
    })
  }

  /**
   * 创建文章。
   */
  static async create(data: {
    title: string
    slug: string
    markdown: string
    excerpt?: string | null
    coverImage?: string | null
    categoryId?: string | null
    tags: string[]
  }): Promise<PostBaseData> {
    return PostRepository.defaultRepository.create(data)
  }

  async create(data: {
    title: string
    slug: string
    markdown: string
    excerpt?: string | null
    coverImage?: string | null
    categoryId?: string | null
    tags: string[]
  }): Promise<PostBaseData> {
    return this.client.post.create({
      data,
      select: POST_BASE_SELECT,
    })
  }

  /**
   * 更新文章。
   */
  static async update(
    id: string,
    data: {
      title?: string
      slug?: string
      markdown?: string
      excerpt?: string | null
      coverImage?: string | null
      categoryId?: string | null
      tags?: string[]
      status?: ContentStatus
      publishedAt?: Date | null
    },
  ): Promise<PostBaseData> {
    return PostRepository.defaultRepository.update(id, data)
  }

  async update(
    id: string,
    data: {
      title?: string
      slug?: string
      markdown?: string
      excerpt?: string | null
      coverImage?: string | null
      categoryId?: string | null
      tags?: string[]
      status?: ContentStatus
      publishedAt?: Date | null
    },
  ): Promise<PostBaseData> {
    return this.client.post.update({
      where: { id },
      data,
      select: POST_BASE_SELECT,
    })
  }

  /**
   * 删除文章。
   */
  static async delete(id: string) {
    return PostRepository.defaultRepository.delete(id)
  }

  async delete(id: string) {
    return this.client.post.delete({
      where: { id },
    })
  }
}
