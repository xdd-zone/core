import type { Prisma } from '@nexus/infra/database/prisma/generated'
import type {
  PublicSiteCategoryList,
  PublicSiteCategoryListQuery,
  PublicSiteConfig,
  PublicSitePost,
  PublicSitePostList,
  PublicSitePostListQuery,
  PublicSitePostSummary,
} from './model'
import type {
  PublicSiteCategoryData,
  PublicSiteCategoryWhereInput,
  PublicSitePostDetailData,
  PublicSitePostSummaryData,
  PublicSitePostWhereInput,
} from './types'
import { NotFoundError } from '@nexus/core/http'
import { buildKeywordSearch } from '@nexus/infra/database'
import { PUBLIC_SITE_CATEGORY_SEARCH_FIELDS, PUBLIC_SITE_POST_SEARCH_FIELDS } from './constants'
import {
  PublicSiteCategoryListSchema,
  PublicSiteConfigSchema,
  PublicSitePostListSchema,
  PublicSitePostSchema,
  PublicSitePostSummarySchema,
} from './model'
import { PublicSiteRepository } from './repository'

const DEFAULT_PUBLIC_SITE_CONFIG = {
  title: 'XDD Zone',
  subtitle: null,
  description: null,
  logo: null,
  favicon: null,
  footerText: null,
  socialLinks: {},
  defaultSeoTitle: null,
  defaultSeoDescription: null,
} satisfies PublicSiteConfig

function normalizeSocialLinks(value: Prisma.JsonValue | null | undefined) {
  return value ?? {}
}

function serializeConfig(config: Awaited<ReturnType<typeof PublicSiteRepository.findConfig>>): PublicSiteConfig {
  return PublicSiteConfigSchema.parse(
    config
      ? {
          ...config,
          socialLinks: normalizeSocialLinks(config.socialLinks),
        }
      : DEFAULT_PUBLIC_SITE_CONFIG,
  )
}

function serializeCategory(category: PublicSiteCategoryData) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder,
    postCount: category._count.posts,
  }
}

function serializePostSummary(post: PublicSitePostSummaryData): PublicSitePostSummary {
  return PublicSitePostSummarySchema.parse({
    ...post,
    publishedAt: post.publishedAt ?? post.createdAt,
  })
}

function serializePost(post: PublicSitePostDetailData): PublicSitePost {
  return PublicSitePostSchema.parse({
    ...post,
    publishedAt: post.publishedAt ?? post.createdAt,
  })
}

export class PublicSiteService {
  private static buildPostWhereConditions(query: PublicSitePostListQuery): PublicSitePostWhereInput {
    const where: PublicSitePostWhereInput = {
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
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: keywordSearch,
        },
      ]
    }

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
    return serializeConfig(await PublicSiteRepository.findConfig())
  }

  static async listCategories(query: PublicSiteCategoryListQuery): Promise<PublicSiteCategoryList> {
    const categories = await PublicSiteRepository.findCategories(this.buildCategoryWhereConditions(query))

    return PublicSiteCategoryListSchema.parse(categories.map(serializeCategory))
  }

  static async listPosts(query: PublicSitePostListQuery): Promise<PublicSitePostList> {
    const result = await PublicSiteRepository.paginatePosts(this.buildPostWhereConditions(query), query)

    return PublicSitePostListSchema.parse({
      ...result,
      items: result.items.map(serializePostSummary),
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

    return serializePost(post)
  }
}
