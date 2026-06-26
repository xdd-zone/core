import type {
  PublicCategory,
  PublicPostDetail,
  PublicPostSummary,
  PublicTag,
} from '@xdd-zone/contracts'
import type { ContentPostRecord } from './types/content.types'
import type { ContentCategoryRecord, ContentTagRecord } from './types/taxonomy.types'
import {
  PublicCategorySchema,
  PublicPostDetailSchema,
  PublicPostSummarySchema,
  PublicTagSchema,
} from '@xdd-zone/contracts'

export function toPublicPostSummary(
  post: ContentPostRecord,
  category: ContentCategoryRecord | null,
  tags: ContentTagRecord[],
): PublicPostSummary {
  const summary = {
    category: category ? toPublicCategory(category) : null,
    coverAssetId: post.coverAssetId,
    excerpt: post.excerpt,
    id: post.id,
    publishedAt: toNullableIsoString(post.publishedAt),
    slug: post.slug,
    tags: tags.map((tag) => toPublicTag(tag)),
    title: post.title,
    updatedAt: toIsoString(post.updatedAt),
  } satisfies PublicPostSummary

  return PublicPostSummarySchema.parse(summary)
}

export function toPublicPostDetail(
  post: ContentPostRecord,
  source: string,
  category: ContentCategoryRecord | null,
  tags: ContentTagRecord[],
): PublicPostDetail {
  const detail = {
    ...toPublicPostSummary(post, category, tags),
    source,
  } satisfies PublicPostDetail

  return PublicPostDetailSchema.parse(detail)
}

export function toPublicCategory(category: ContentCategoryRecord): PublicCategory {
  const summary = {
    description: category.description,
    id: category.id,
    name: category.name,
    slug: category.slug,
  } satisfies PublicCategory

  return PublicCategorySchema.parse(summary)
}

export function toPublicTag(tag: ContentTagRecord): PublicTag {
  const summary = {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  } satisfies PublicTag

  return PublicTagSchema.parse(summary)
}

function toIsoString(date: Date): string {
  return date.toISOString()
}

function toNullableIsoString(date: Date | null): string | null {
  return date?.toISOString() ?? null
}
