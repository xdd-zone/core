import type { PaginatedList, PaginationQuery } from '@nexus/infra/database'
import type { CategoryBaseData, CategoryWhereInput } from './types'
import { prisma } from '@nexus/infra/database'
import { PrismaService } from '@nexus/infra/database/prisma.service'
import { CATEGORY_BASE_SELECT } from './constants'

export class CategoryRepository {
  static async paginate(where: CategoryWhereInput, query: PaginationQuery): Promise<PaginatedList<CategoryBaseData>> {
    return PrismaService.paginate<CategoryBaseData>('category', where, query, {
      select: CATEGORY_BASE_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
  }

  static async findMany(where: CategoryWhereInput = {}): Promise<CategoryBaseData[]> {
    return prisma.category.findMany({
      where,
      select: CATEGORY_BASE_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
  }

  static async findById(id: string): Promise<CategoryBaseData | null> {
    return prisma.category.findUnique({
      where: { id },
      select: CATEGORY_BASE_SELECT,
    })
  }

  static async findBySlug(slug: string): Promise<CategoryBaseData | null> {
    return prisma.category.findUnique({
      where: { slug },
      select: CATEGORY_BASE_SELECT,
    })
  }

  static async create(data: {
    name: string
    slug: string
    description?: string | null
    sortOrder?: number
    isVisible?: boolean
  }): Promise<CategoryBaseData> {
    return prisma.category.create({
      data,
      select: CATEGORY_BASE_SELECT,
    })
  }

  static async update(
    id: string,
    data: {
      name?: string
      slug?: string
      description?: string | null
      sortOrder?: number
      isVisible?: boolean
    },
  ): Promise<CategoryBaseData> {
    return prisma.category.update({
      where: { id },
      data,
      select: CATEGORY_BASE_SELECT,
    })
  }

  static async delete(id: string) {
    return prisma.category.delete({
      where: { id },
    })
  }

  static async countPublishedPosts(categoryIds: string[]): Promise<Map<string, number>> {
    if (categoryIds.length === 0) {
      return new Map()
    }

    const rows = await prisma.post.groupBy({
      by: ['categoryId'],
      where: {
        categoryId: {
          in: categoryIds,
        },
        status: 'PUBLISHED',
      },
      _count: {
        _all: true,
      },
    })

    return new Map(rows.flatMap((row) => (row.categoryId ? [[row.categoryId, row._count._all]] : [])))
  }
}
