import type { PaginatedList, PaginationQuery } from '@nexus/infra/database'
import type { ContentStatus } from '@nexus/infra/database/prisma/generated'
import type { PostBaseData, PostWhereInput } from './types'
import { prisma } from '@nexus/infra/database'
import { PrismaService } from '@nexus/infra/database/prisma.service'
import { POST_BASE_SELECT } from './constants'

/**
 * 文章仓储类。
 */
export class PostRepository {
  /**
   * 分页查询文章。
   */
  static async paginate(where: PostWhereInput, query: PaginationQuery): Promise<PaginatedList<PostBaseData>> {
    return PrismaService.paginate<PostBaseData>('post', where, query, {
      select: POST_BASE_SELECT,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })
  }

  /**
   * 根据 ID 查询文章。
   */
  static async findById(id: string): Promise<PostBaseData | null> {
    return prisma.post.findUnique({
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
    category?: string | null
    tags: string[]
  }): Promise<PostBaseData> {
    return prisma.post.create({
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
      category?: string | null
      tags?: string[]
      status?: ContentStatus
      publishedAt?: Date | null
    },
  ): Promise<PostBaseData> {
    return prisma.post.update({
      where: { id },
      data,
      select: POST_BASE_SELECT,
    })
  }

  /**
   * 删除文章。
   */
  static async delete(id: string) {
    return prisma.post.delete({
      where: { id },
    })
  }
}
