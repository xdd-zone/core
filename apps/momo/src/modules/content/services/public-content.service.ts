import type {
  PublicCategoryListItem,
  PublicPostDetail,
  PublicPostListQuery,
  PublicPostSummary,
  PublicTag,
} from '@xdd-zone/contracts'
import type { ContentRepository } from '../repositories/content.repository'
import type { TaxonomyRepository } from '../repositories/taxonomy.repository'
import type { ContentPostRecord } from '../types/content.types'
import { BizCode } from '@xdd-zone/contracts'
import { AppError } from '#momo/shared/app-error'

import {
  toPublicCategoryListItem,
  toPublicPostDetail,
  toPublicPostSummary,
  toPublicTag,
} from '../public-content.presenter'

export function createPublicContentService(repository: ContentRepository, taxonomyRepository: TaxonomyRepository) {
  async function listPosts(query: PublicPostListQuery): Promise<{ posts: PublicPostSummary[] }> {
    const page = normalizePage(query.page)
    const pageSize = normalizePageSize(query.pageSize)
    const posts = await repository.listPublicPosts({
      categorySlug: normalizeText(query.categorySlug),
      limit: pageSize,
      offset: (page - 1) * pageSize,
      tagSlug: normalizeText(query.tagSlug),
    })

    return {
      posts: await enrichPostsWithTaxonomy(posts),
    }
  }

  async function getPostBySlug(slug: string): Promise<PublicPostDetail> {
    const post = await repository.getPostBySlug(slug)
    if (!post || post.status !== 'published') {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    if (!post.publishedRevisionId) {
      throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, '文章发布版本不存在', 500)
    }

    const revision = await repository.getRevisionById(post.publishedRevisionId)
    if (!revision) {
      throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, '文章发布版本不存在', 500)
    }

    const [category, tags] = await Promise.all([
      post.publishedCategoryId ? taxonomyRepository.getCategoryById(post.publishedCategoryId) : Promise.resolve(null),
      taxonomyRepository.getPublishedPostTags(post.id),
    ])

    return toPublicPostDetail(post, revision.source, category ?? null, tags)
  }

  async function listCategories(): Promise<PublicCategoryListItem[]> {
    const categories = await taxonomyRepository.listCategoriesWithPublishedCount()
    return categories.map((category) => toPublicCategoryListItem(category))
  }

  async function listTags(): Promise<PublicTag[]> {
    const tags = await taxonomyRepository.listTags()
    return tags.map((tag) => toPublicTag(tag))
  }

  async function enrichPostsWithTaxonomy(posts: ContentPostRecord[]): Promise<PublicPostSummary[]> {
    if (posts.length === 0) {
      return []
    }

    const postIds = posts.map((post) => post.id)
    const categoryIdMap = await repository.getPublishedCategoriesByPostIds(postIds)
    const uniqueCategoryIds = [...new Set(categoryIdMap.values())]

    const [categories, tagsMap] = await Promise.all([
      Promise.all(uniqueCategoryIds.map((id) => taxonomyRepository.getCategoryById(id))),
      taxonomyRepository.getPublishedPostTagsByPostIds(postIds),
    ])

    const categoryMap = new Map(categories.filter((c): c is NonNullable<typeof c> => !!c).map((c) => [c.id, c]))

    return posts.map((post) => {
      const categoryId = categoryIdMap.get(post.id)
      const category = categoryId ? (categoryMap.get(categoryId) ?? null) : null
      const tags = tagsMap.get(post.id) ?? []

      return toPublicPostSummary(post, category, tags)
    })
  }

  return {
    getPostBySlug,
    listCategories,
    listPosts,
    listTags,
  }
}

function normalizePage(value: number | undefined): number {
  if (!value || Number.isNaN(value)) {
    return 1
  }

  return Math.max(1, Math.floor(value))
}

function normalizePageSize(value: number | undefined): number {
  if (!value || Number.isNaN(value)) {
    return 10
  }

  return Math.min(50, Math.max(1, Math.floor(value)))
}

function normalizeText(value: string | undefined): string | undefined {
  return value?.trim() || undefined
}

export type PublicContentService = ReturnType<typeof createPublicContentService>
