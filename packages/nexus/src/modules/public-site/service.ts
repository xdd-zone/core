import type {
  PublicSiteArchiveList,
  PublicSiteArchivePostListQuery,
  PublicSiteCategoryList,
  PublicSiteCategoryListQuery,
  PublicSiteConfig,
  PublicSitePost,
  PublicSitePostList,
  PublicSitePostListQuery,
} from './model'
import type { PublicSiteCategoryWhereInput, PublicSitePostWhereInput } from './types'
import { NotFoundError } from '@nexus/core/http'
import { buildKeywordSearch } from '@nexus/infra/database'
import { PUBLIC_SITE_CATEGORY_SEARCH_FIELDS, PUBLIC_SITE_POST_SEARCH_FIELDS } from './constants'
import {
  DEFAULT_PUBLIC_SITE_CONFIG,
  serializePublicSiteCategory,
  serializePublicSiteConfig,
  serializePublicSitePost,
  serializePublicSitePostSummary,
} from './mapper'
import { PublicSitePostListSchema } from './model'
import { PublicSiteRepository } from './repository'

export class PublicSiteService {
  private static buildPublicPostWhereConditions(): PublicSitePostWhereInput {
    return {
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
    }
  }

  private static appendPostAndCondition(where: PublicSitePostWhereInput, condition: PublicSitePostWhereInput) {
    where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), condition]
  }

  private static buildPostWhereConditions(query: PublicSitePostListQuery): PublicSitePostWhereInput {
    const where = this.buildPublicPostWhereConditions()

    if (query.categoryId) {
      where.categoryId = query.categoryId
      where.category = {
        isVisible: true,
      }
      delete where.OR
    }

    if (query.categorySlug) {
      where.category = {
        slug: query.categorySlug,
        isVisible: true,
      }
      delete where.OR
    }

    if (query.tag) {
      where.tags = {
        has: query.tag,
      }
    }

    const keywordSearch = buildKeywordSearch(query.keyword, [...PUBLIC_SITE_POST_SEARCH_FIELDS]) as
      | PublicSitePostWhereInput['OR']
      | undefined
    if (keywordSearch) {
      this.appendPostAndCondition(where, {
        OR: keywordSearch,
      })
    }

    return where
  }

  private static buildArchivePostWhereConditions(query: PublicSiteArchivePostListQuery): PublicSitePostWhereInput {
    const where = this.buildPublicPostWhereConditions()
    const start = new Date(Date.UTC(query.year, query.month ? query.month - 1 : 0, 1))
    const end = query.month ? new Date(Date.UTC(query.year, query.month, 1)) : new Date(Date.UTC(query.year + 1, 0, 1))

    this.appendPostAndCondition(where, {
      OR: [
        {
          publishedAt: {
            gte: start,
            lt: end,
          },
        },
        {
          publishedAt: null,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      ],
    })

    return where
  }

  private static buildCategoryWhereConditions(query: PublicSiteCategoryListQuery): PublicSiteCategoryWhereInput {
    const where: PublicSiteCategoryWhereInput = {
      isVisible: true,
    }

    const keywordSearch = buildKeywordSearch(query.keyword, [...PUBLIC_SITE_CATEGORY_SEARCH_FIELDS]) as
      | PublicSiteCategoryWhereInput['OR']
      | undefined
    if (keywordSearch) {
      where.OR = keywordSearch
    }

    return where
  }

  static async getConfig(): Promise<PublicSiteConfig> {
    const config = await PublicSiteRepository.findConfig()
    return config ? serializePublicSiteConfig(config) : DEFAULT_PUBLIC_SITE_CONFIG
  }

  static async listCategories(query: PublicSiteCategoryListQuery): Promise<PublicSiteCategoryList> {
    const categories = await PublicSiteRepository.findCategories(this.buildCategoryWhereConditions(query))

    return categories.map(serializePublicSiteCategory)
  }

  static async listPosts(query: PublicSitePostListQuery): Promise<PublicSitePostList> {
    const result = await PublicSiteRepository.paginatePosts(this.buildPostWhereConditions(query), query)

    return PublicSitePostListSchema.parse({
      ...result,
      items: result.items.map(serializePublicSitePostSummary),
    })
  }

  static async listArchives(): Promise<PublicSiteArchiveList> {
    const posts = await PublicSiteRepository.findArchivePostDates(this.buildPublicPostWhereConditions())
    const archiveByYear = new Map<number, Map<number, number>>()

    for (const post of posts) {
      const archiveDate = post.publishedAt ?? post.createdAt
      const year = archiveDate.getUTCFullYear()
      const month = archiveDate.getUTCMonth() + 1
      const months = archiveByYear.get(year) ?? new Map<number, number>()

      months.set(month, (months.get(month) ?? 0) + 1)
      archiveByYear.set(year, months)
    }

    const items = Array.from(archiveByYear.entries())
      .sort(([leftYear], [rightYear]) => rightYear - leftYear)
      .map(([year, months]) => {
        const monthItems = Array.from(months.entries())
          .sort(([leftMonth], [rightMonth]) => rightMonth - leftMonth)
          .map(([month, count]) => ({
            year,
            month,
            count,
          }))

        return {
          year,
          count: monthItems.reduce((total, item) => total + item.count, 0),
          months: monthItems,
        }
      })

    return {
      items,
    }
  }

  static async listArchivePosts(query: PublicSiteArchivePostListQuery): Promise<PublicSitePostList> {
    const result = await PublicSiteRepository.paginateArchivePosts(this.buildArchivePostWhereConditions(query), query)

    return PublicSitePostListSchema.parse({
      ...result,
      items: result.items.map(serializePublicSitePostSummary),
    })
  }

  static async listPostsByCategorySlug(slug: string, query: PublicSitePostListQuery): Promise<PublicSitePostList> {
    const category = await PublicSiteRepository.findCategoryBySlug(slug)
    if (!category) {
      throw new NotFoundError('分类不存在')
    }

    return await this.listPosts({
      keyword: query.keyword,
      page: query.page,
      pageSize: query.pageSize,
      tag: query.tag,
      categorySlug: slug,
    })
  }

  static async findPostBySlug(slug: string): Promise<PublicSitePost> {
    const post = await PublicSiteRepository.findPostBySlug(slug)
    if (!post) {
      throw new NotFoundError('文章不存在')
    }

    return serializePublicSitePost(post)
  }
}
