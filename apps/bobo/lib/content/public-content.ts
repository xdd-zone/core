import type { ApiResponse, PublicCategory, PublicPostSummary, PublicTag } from '@xdd-zone/contracts'
import {
  PublicCategoryListResponseSchema,
  PublicPostListResponseSchema,
  PublicPostResponseSchema,
  PublicTagListResponseSchema,
} from '@xdd-zone/contracts'

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
  const data = await fetchMomoData(
    buildMomoUrl(`/rpc/bobo/content/posts/${encodeURIComponent(slug)}`),
    PublicPostResponseSchema,
    'Momo 返回的公开文章详情格式不正确。',
  )

  return data.post
}

async function fetchPublicPosts(filters: PublicContentFilters): Promise<PublicPostSummary[]> {
  const url = buildMomoUrl('/rpc/bobo/content/posts')
  url.searchParams.set('pageSize', '50')
  if (filters.categorySlug) url.searchParams.set('categorySlug', filters.categorySlug)
  if (filters.tagSlug) url.searchParams.set('tagSlug', filters.tagSlug)

  const data = await fetchMomoData(url, PublicPostListResponseSchema, 'Momo 返回的公开文章列表格式不正确。')
  return data.posts
}

async function fetchPublicCategories(): Promise<PublicCategory[]> {
  const data = await fetchMomoData(
    buildMomoUrl('/rpc/bobo/content/categories'),
    PublicCategoryListResponseSchema,
    'Momo 返回的文章分类格式不正确。',
  )
  return data.categories
}

async function fetchPublicTags(): Promise<PublicTag[]> {
  const data = await fetchMomoData(
    buildMomoUrl('/rpc/bobo/content/tags'),
    PublicTagListResponseSchema,
    'Momo 返回的文章标签格式不正确。',
  )
  return data.tags
}

async function fetchMomoData<T>(
  url: URL,
  schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } },
  invalidMessage: string,
): Promise<T> {
  const response = await fetch(url, {
    next: {
      revalidate: 60,
    },
  })

  if (!response.ok) {
    throw new PublicContentError('request-failed', 'Momo 公开文章接口暂时不可用。')
  }

  const body = (await response.json()) as ApiResponse<unknown>
  if (!body.ok) {
    throw new PublicContentError('request-failed', body.error.message || 'Momo 公开文章接口暂时不可用。')
  }

  const parsed = schema.safeParse(body.data)
  if (!parsed.success) {
    throw new PublicContentError('invalid-response', invalidMessage)
  }

  return parsed.data
}

function buildMomoUrl(pathname: string) {
  const baseUrl = process.env.MOMO_BASE_URL || 'http://localhost:7788'
  return new URL(pathname, baseUrl)
}

export type PublicContentErrorReason = 'request-failed' | 'invalid-response'

export class PublicContentError extends Error {
  readonly reason: PublicContentErrorReason

  constructor(reason: PublicContentErrorReason, message: string) {
    super(message)
    this.name = 'PublicContentError'
    this.reason = reason
  }
}
