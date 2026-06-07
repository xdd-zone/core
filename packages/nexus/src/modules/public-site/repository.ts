import type { Prisma } from '@nexus-prisma/generated/client'
import type { PaginatedList, PaginationQuery } from '@nexus/infra/database'
import type {
  PublicSiteArchivePostDateData,
  PublicSiteCategoryData,
  PublicSiteCategoryWhereInput,
  PublicSiteConfigData,
  PublicSitePostDetailData,
  PublicSitePostSummaryData,
  PublicSitePostWhereInput,
} from './types'
import { prisma } from '@nexus/infra/database'
import { PrismaService } from '@nexus/infra/database/prisma.service'
import {
  PUBLIC_SITE_ARCHIVE_POST_DATE_SELECT,
  PUBLIC_SITE_CATEGORY_SELECT,
  PUBLIC_SITE_CONFIG_SELECT,
  PUBLIC_SITE_POST_DETAIL_SELECT,
  PUBLIC_SITE_POST_SUMMARY_SELECT,
} from './constants'

export class PublicSiteRepository {
  static async findConfig(): Promise<PublicSiteConfigData | null> {
    return prisma.siteConfig.findUnique({
      where: { id: 'default' },
      select: PUBLIC_SITE_CONFIG_SELECT,
    })
  }

  static async findCategories(where: PublicSiteCategoryWhereInput = {}): Promise<PublicSiteCategoryData[]> {
    return prisma.category.findMany({
      where,
      select: PUBLIC_SITE_CATEGORY_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
  }

  static async findCategoryBySlug(slug: string): Promise<PublicSiteCategoryData | null> {
    return prisma.category.findFirst({
      where: {
        slug,
        isVisible: true,
      },
      select: PUBLIC_SITE_CATEGORY_SELECT,
    })
  }

  static async paginatePosts(
    where: PublicSitePostWhereInput,
    query: PaginationQuery,
  ): Promise<PaginatedList<PublicSitePostSummaryData>> {
    return PrismaService.paginate<
      PublicSitePostSummaryData,
      PublicSitePostWhereInput,
      typeof PUBLIC_SITE_POST_SUMMARY_SELECT,
      Prisma.PostOrderByWithRelationInput[]
    >('post', where, query, {
      select: PUBLIC_SITE_POST_SUMMARY_SELECT,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })
  }

  static async findArchivePostDates(where: PublicSitePostWhereInput): Promise<PublicSiteArchivePostDateData[]> {
    return prisma.post.findMany({
      where,
      select: PUBLIC_SITE_ARCHIVE_POST_DATE_SELECT,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })
  }

  static async paginateArchivePosts(
    where: PublicSitePostWhereInput,
    query: PaginationQuery,
  ): Promise<PaginatedList<PublicSitePostSummaryData>> {
    return PrismaService.paginate<
      PublicSitePostSummaryData,
      PublicSitePostWhereInput,
      typeof PUBLIC_SITE_POST_SUMMARY_SELECT,
      Prisma.PostOrderByWithRelationInput[]
    >('post', where, query, {
      select: PUBLIC_SITE_POST_SUMMARY_SELECT,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })
  }

  static async findPostBySlug(slug: string): Promise<PublicSitePostDetailData | null> {
    return prisma.post.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        OR: [
          {
            categoryId: null,
          },
          {
            category: {
              isVisible: true,
            },
          },
        ],
      },
      select: PUBLIC_SITE_POST_DETAIL_SELECT,
    })
  }
}
