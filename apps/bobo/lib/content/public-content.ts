import type { BizCodeValue, PublicCategory, PublicPostSummary, PublicTag } from '@xdd-zone/contracts'
import {
  PublicCategoryListResponseSchema,
  PublicPostListResponseSchema,
  PublicPostResponseSchema,
  PublicTagListResponseSchema,
} from '@xdd-zone/contracts'
import { getPublicCategories as requestPublicCategories } from '@/lib/api/category.api'
import { getPublicPost as requestPublicPost, getPublicPosts as requestPublicPosts } from '@/lib/api/post.api'
import { getPublicTags as requestPublicTags } from '@/lib/api/tag.api'

export interface PublicContentFilters {
  categorySlug?: string
  tagSlug?: string
}

export interface PublicWritingData {
  categories: PublicCategory[]
  posts: PublicPostSummary[]
  tags: PublicTag[]
}

export async function getPublicWritingData(filters: PublicContentFilters = {}): Promise<PublicWritingData> {
  const [posts, categories, tags] = await Promise.all([
    fetchPublicPosts(filters),
    fetchPublicCategories(),
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
    throw new PublicContentError('request-failed', body.error.message || 'Momo 公开文章接口暂时不可用。', body.error.code)
  }

  const parsed = PublicPostResponseSchema.safeParse(body.data)

  if (!parsed.success) {
    throw new PublicContentError('invalid-response', 'Momo 返回的公开文章详情格式不正确。')
  }

  return parsed.data.post
}

async function fetchPublicPosts(filters: PublicContentFilters): Promise<PublicPostSummary[]> {
  const body = await requestPublicPosts({
    ...filters,
    pageSize: 50,
  })

  if (!body.ok) {
    throw new PublicContentError('request-failed', body.error.message || 'Momo 公开文章接口暂时不可用。', body.error.code)
  }

  const parsed = PublicPostListResponseSchema.safeParse(body.data)

  if (!parsed.success) {
    throw new PublicContentError('invalid-response', 'Momo 返回的公开文章列表格式不正确。')
  }

  return parsed.data.posts
}

async function fetchPublicCategories(): Promise<PublicCategory[]> {
  const body = await requestPublicCategories()

  if (!body.ok) {
    throw new PublicContentError('request-failed', body.error.message || 'Momo 公开文章接口暂时不可用。', body.error.code)
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
    throw new PublicContentError('request-failed', body.error.message || 'Momo 公开文章接口暂时不可用。', body.error.code)
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
