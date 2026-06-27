import type { BizCodeValue, PublicCategoryListItem, PublicPostSummary, PublicTag } from '@xdd-zone/contracts'
import {
  PublicCategoryListResponseSchema,
  PublicPostListResponseSchema,
  PublicPostResponseSchema,
  PublicTagListResponseSchema,
} from '@xdd-zone/contracts'
import { getPublicCategories as requestPublicCategories } from '@/lib/api/category.api'
import { getPublicPost as requestPublicPost, getPublicPosts as requestPublicPosts } from '@/lib/api/post.api'
import { getPublicTags as requestPublicTags } from '@/lib/api/tag.api'

const CATEGORY_MENU_POST_LIMIT = 5

export interface PublicContentFilters {
  categorySlug?: string
  tagSlug?: string
}

export interface PublicCategoryMenuItem extends PublicCategoryListItem {
  posts: PublicPostSummary[]
}

export interface PublicWritingData {
  categories: PublicCategoryMenuItem[]
  posts: PublicPostSummary[]
  tags: PublicTag[]
}

export async function getPublicWritingData(filters: PublicContentFilters = {}): Promise<PublicWritingData> {
  const [posts, categories, tags] = await Promise.all([
    fetchPublicPosts(filters),
    getPublicCategoryMenu(),
    fetchPublicTags(),
  ])

  return {
    categories,
    posts,
    tags,
  }
}

export async function getPublicPost(slug: string) {
  const body = await requestPublicPost(slug)

  if (!body.ok) {
    throw new PublicContentError(
      'request-failed',
      body.error.message || 'Momo 公开文章接口暂时不可用。',
      body.error.code,
    )
  }

  const parsed = PublicPostResponseSchema.safeParse(body.data)

  if (!parsed.success) {
    throw new PublicContentError('invalid-response', 'Momo 返回的公开文章详情格式不正确。')
  }

  return parsed.data.post
}

export async function getPublicCategoryMenu(): Promise<PublicCategoryMenuItem[]> {
  const categories = await fetchPublicCategories()
  const postsByCategory = await Promise.all(
    categories.map((category) =>
      fetchPublicPosts({
        categorySlug: category.slug,
        pageSize: CATEGORY_MENU_POST_LIMIT,
      }),
    ),
  )

  return categories.map((category, index) => ({
    ...category,
    posts: postsByCategory[index]?.slice(0, CATEGORY_MENU_POST_LIMIT) ?? [],
  }))
}

async function fetchPublicPosts(
  filters: PublicContentFilters & {
    pageSize?: number
  },
): Promise<PublicPostSummary[]> {
  const body = await requestPublicPosts({
    ...filters,
    pageSize: filters.pageSize ?? 50,
  })

  if (!body.ok) {
    throw new PublicContentError(
      'request-failed',
      body.error.message || 'Momo 公开文章接口暂时不可用。',
      body.error.code,
    )
  }

  const parsed = PublicPostListResponseSchema.safeParse(body.data)

  if (!parsed.success) {
    throw new PublicContentError('invalid-response', 'Momo 返回的公开文章列表格式不正确。')
  }

  return parsed.data.posts
}

async function fetchPublicCategories(): Promise<PublicCategoryListItem[]> {
  const body = await requestPublicCategories()

  if (!body.ok) {
    throw new PublicContentError(
      'request-failed',
      body.error.message || 'Momo 公开文章接口暂时不可用。',
      body.error.code,
    )
  }

  const parsed = PublicCategoryListResponseSchema.safeParse(body.data)

  if (!parsed.success) {
    throw new PublicContentError('invalid-response', 'Momo 返回的文章分类格式不正确。')
  }

  return parsed.data.categories
}

async function fetchPublicTags(): Promise<PublicTag[]> {
  const body = await requestPublicTags()

  if (!body.ok) {
    throw new PublicContentError(
      'request-failed',
      body.error.message || 'Momo 公开文章接口暂时不可用。',
      body.error.code,
    )
  }

  const parsed = PublicTagListResponseSchema.safeParse(body.data)

  if (!parsed.success) {
    throw new PublicContentError('invalid-response', 'Momo 返回的文章标签格式不正确。')
  }

  return parsed.data.tags
}

export type PublicContentErrorReason = 'request-failed' | 'invalid-response'

export class PublicContentError extends Error {
  readonly reason: PublicContentErrorReason
  readonly code?: BizCodeValue

  constructor(reason: PublicContentErrorReason, message: string, code?: BizCodeValue) {
    super(message)
    this.name = 'PublicContentError'
    this.reason = reason
    this.code = code
  }
}
