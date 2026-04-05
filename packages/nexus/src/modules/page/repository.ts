import type { PaginatedList, PaginationQuery } from '@nexus/infra/database'
import type { ContentStatus } from '@nexus/infra/database/prisma/generated'
import type { PageBaseData, PageListItemBaseData, PageWhereInput } from './types'
import { prisma } from '@nexus/infra/database'
import { PrismaService } from '@nexus/infra/database/prisma.service'
import { PAGE_BASE_SELECT, PAGE_LIST_SELECT } from './constants'

/**
 * 页面仓储类。
 */
export class PageRepository {
  /**
   * 分页查询页面。
   */
  static async paginate(where: PageWhereInput, query: PaginationQuery): Promise<PaginatedList<PageListItemBaseData>> {
    return PrismaService.paginate<PageListItemBaseData>('page', where, query, {
      select: PAGE_LIST_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    })
  }

  /**
   * 根据 ID 查询页面。
   */
  static async findById(id: string): Promise<PageBaseData | null> {
    return prisma.page.findUnique({
      where: { id },
      select: PAGE_BASE_SELECT,
    })
  }

  /**
   * 创建页面。
   */
  static async create(data: {
    title: string
    slug: string
    markdown: string
    excerpt?: string | null
    coverImage?: string | null
    showInNavigation: boolean
    sortOrder: number
  }): Promise<PageBaseData> {
    return prisma.page.create({
      data,
      select: PAGE_BASE_SELECT,
    })
  }

  /**
   * 更新页面。
   */
  static async update(
    id: string,
    data: {
      title?: string
      slug?: string
      markdown?: string
      excerpt?: string | null
      coverImage?: string | null
      showInNavigation?: boolean
      sortOrder?: number
      status?: ContentStatus
      publishedAt?: Date | null
    },
  ): Promise<PageBaseData> {
    return prisma.page.update({
      where: { id },
      data,
      select: PAGE_BASE_SELECT,
    })
  }

  /**
   * 删除页面。
   */
  static async delete(id: string) {
    return prisma.page.delete({
      where: { id },
    })
  }
}
