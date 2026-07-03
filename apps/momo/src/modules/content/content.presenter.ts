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
  | 'createdAt'
  | 'draftCategoryId'
  | 'draftCoverAssetId'
  | 'draftExcerpt'
  | 'draftSlug'
  | 'draftTitle'
  | 'id'
  | 'publishedAt'
  | 'publishedCategoryId'
  | 'publishedCoverAssetId'
  | 'publishedExcerpt'
  | 'publishedSlug'
  | 'publishedTitle'
  | 'status'
  | 'updatedAt'
>

export type PostDetailSource = Pick<
  ContentPostRecord,
  | 'createdAt'
  | 'draftCategoryId'
  | 'draftCoverAssetId'
  | 'draftExcerpt'
  | 'draftRevisionId'
  | 'draftSlug'
  | 'draftTitle'
  | 'id'
  | 'publishedAt'
  | 'publishedCategoryId'
  | 'publishedCoverAssetId'
  | 'publishedExcerpt'
  | 'publishedRevisionId'
  | 'publishedSlug'
  | 'publishedTitle'
  | 'status'
  | 'updatedAt'
>

export type PostRevisionSource = Pick<
  ContentRevisionRecord,
  'createdAt' | 'excerpt' | 'id' | 'postId' | 'revisionNo' | 'source' | 'title'
>

export interface PreviewTokenSource {
  expiresAt: Date
  targetId: string
  targetType: 'post' | 'project' | 'site-page'
  token: string
}

export function toPostSummary(
  post: PostSummarySource,
  draftCategory: ContentCategoryRecord | null,
  draftTags: ContentTagRecord[],
  publishedCategory: ContentCategoryRecord | null,
  publishedTags: ContentTagRecord[],
): PostSummary {
  const summary = {
    createdAt: toIsoString(post.createdAt),
    draft: {
      category: draftCategory ? toCategorySummary(draftCategory) : null,
      coverAssetId: post.draftCoverAssetId,
      excerpt: post.draftExcerpt,
      slug: post.draftSlug,
      tags: draftTags.map((tag) => toTagSummary(tag)),
      title: post.draftTitle,
    },
    id: post.id,
    published: {
      category: publishedCategory ? toCategorySummary(publishedCategory) : null,
      coverAssetId: post.publishedCoverAssetId,
      excerpt: post.publishedExcerpt,
      publishedAt: toNullableIsoString(post.publishedAt),
      slug: post.publishedSlug,
      tags: publishedTags.map((tag) => toTagSummary(tag)),
      title: post.publishedTitle,
    },
    status: post.status,
    updatedAt: toIsoString(post.updatedAt),
  } satisfies PostSummary

  return PostSummarySchema.parse(summary)
}

export function toPostDetail(
  post: PostDetailSource,
  source: string,
  draftCategory: ContentCategoryRecord | null,
  draftTags: ContentTagRecord[],
  publishedCategory: ContentCategoryRecord | null,
  publishedTags: ContentTagRecord[],
): PostDetail {
  const detail = {
    ...toPostSummary(post, draftCategory, draftTags, publishedCategory, publishedTags),
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
