import type {
  CategorySummary,
  PostDetail,
  PostRevision,
  PostSummary,
  PreviewTokenResponse,
  TagSummary,
} from '@xdd-zone/contracts'
import type { ContentPostRecord, ContentRevisionRecord } from './types/content.types'
import type { ContentCategoryRecord, ContentTagRecord } from './types/taxonomy.types'
import {
  CategorySummarySchema,
  PostDetailSchema,
  PostRevisionSchema,
  PostSummarySchema,
  PreviewTokenResponseSchema,
  TagSummarySchema,
} from '@xdd-zone/contracts'

export type PostSummarySource = Pick<
  ContentPostRecord,
  | 'coverAssetId'
  | 'createdAt'
  | 'draftCoverAssetId'
  | 'draftExcerpt'
  | 'draftSlug'
  | 'draftTitle'
  | 'excerpt'
  | 'id'
  | 'publishedAt'
  | 'publishedSlug'
  | 'publishedTitle'
  | 'slug'
  | 'status'
  | 'title'
  | 'updatedAt'
>

export type PostDetailSource = Pick<
  ContentPostRecord,
  | 'coverAssetId'
  | 'createdAt'
  | 'draftCoverAssetId'
  | 'draftExcerpt'
  | 'draftRevisionId'
  | 'draftSlug'
  | 'draftTitle'
  | 'excerpt'
  | 'id'
  | 'publishedAt'
  | 'publishedRevisionId'
  | 'publishedSlug'
  | 'publishedTitle'
  | 'slug'
  | 'status'
  | 'title'
  | 'updatedAt'
>

export type PostRevisionSource = Pick<
  ContentRevisionRecord,
  'createdAt' | 'excerpt' | 'id' | 'postId' | 'revisionNo' | 'source' | 'title'
>

export interface PreviewTokenSource {
  expiresAt: Date
  postId?: string | null
  revisionId?: string | null
  targetId: string
  targetType: 'post' | 'project' | 'site-page'
  token: string
}

export function toPostSummary(
  post: PostSummarySource,
  category: ContentCategoryRecord | null,
  tags: ContentTagRecord[],
): PostSummary {
  const summary = {
    category: category ? toCategorySummary(category) : null,
    coverAssetId: post.draftCoverAssetId ?? post.coverAssetId,
    createdAt: toIsoString(post.createdAt),
    draftSlug: post.draftSlug,
    draftTitle: post.draftTitle,
    excerpt: post.draftExcerpt ?? post.excerpt,
    id: post.id,
    publishedAt: toNullableIsoString(post.publishedAt),
    publishedSlug: post.publishedSlug,
    publishedTitle: post.publishedTitle,
    slug: post.draftSlug,
    status: post.status,
    tags: tags.map((tag) => toTagSummary(tag)),
    title: post.draftTitle,
    updatedAt: toIsoString(post.updatedAt),
  } satisfies PostSummary

  return PostSummarySchema.parse(summary)
}

export function toPostDetail(
  post: PostDetailSource,
  source: string,
  category: ContentCategoryRecord | null,
  tags: ContentTagRecord[],
): PostDetail {
  const detail = {
    ...toPostSummary(post, category, tags),
    draftRevisionId: post.draftRevisionId,
    publishedRevisionId: post.publishedRevisionId,
    source,
  } satisfies PostDetail

  return PostDetailSchema.parse(detail)
}

export function toPostRevision(revision: PostRevisionSource): PostRevision {
  const postRevision = {
    createdAt: toIsoString(revision.createdAt),
    excerpt: revision.excerpt,
    id: revision.id,
    postId: revision.postId,
    revisionNo: revision.revisionNo,
    source: revision.source,
    title: revision.title,
  } satisfies PostRevision

  return PostRevisionSchema.parse(postRevision)
}

export function toPreviewTokenResponse(input: PreviewTokenSource): PreviewTokenResponse {
  const response = {
    expiresAt: toIsoString(input.expiresAt),
    postId: input.postId ?? null,
    revisionId: input.revisionId ?? null,
    targetId: input.targetId,
    targetType: input.targetType,
    token: input.token,
  } satisfies PreviewTokenResponse

  return PreviewTokenResponseSchema.parse(response)
}

function toIsoString(date: Date): string {
  return date.toISOString()
}

function toNullableIsoString(date: Date | null): string | null {
  return date?.toISOString() ?? null
}

function toCategorySummary(category: ContentCategoryRecord): CategorySummary {
  const summary = {
    description: category.description,
    id: category.id,
    name: category.name,
    slug: category.slug,
  } satisfies CategorySummary

  return CategorySummarySchema.parse(summary)
}

function toTagSummary(tag: ContentTagRecord): TagSummary {
  const summary = {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  } satisfies TagSummary

  return TagSummarySchema.parse(summary)
}
