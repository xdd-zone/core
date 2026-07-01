import type {
  CategorySummary,
  ImageAsset,
  PostDetail,
  PostRevision,
  PostSummary,
  PreviewTokenResponse,
  TagSummary,
} from '@xdd-zone/contracts'
import type { ContentAssetRecord, ContentPostRecord, ContentRevisionRecord } from './types/content.types'
import type { ContentCategoryRecord, ContentTagRecord } from './types/taxonomy.types'
import {
  CategorySummarySchema,
  ImageAssetSchema,
  PostDetailSchema,
  PostRevisionSchema,
  PostSummarySchema,
  PreviewTokenResponseSchema,
  TagSummarySchema,
} from '@xdd-zone/contracts'

export type PostSummarySource = Pick<
  ContentPostRecord,
  'coverAssetId' | 'createdAt' | 'excerpt' | 'id' | 'publishedAt' | 'slug' | 'status' | 'title' | 'updatedAt'
>

export type PostDetailSource = Pick<
  ContentPostRecord,
  | 'coverAssetId'
  | 'createdAt'
  | 'draftRevisionId'
  | 'excerpt'
  | 'id'
  | 'publishedAt'
  | 'publishedRevisionId'
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
  postId: string
  revisionId: string
  token: string
}

export function toPostSummary(
  post: PostSummarySource,
  category: ContentCategoryRecord | null,
  tags: ContentTagRecord[],
): PostSummary {
  const summary = {
    category: category ? toCategorySummary(category) : null,
    coverAssetId: post.coverAssetId,
    createdAt: toIsoString(post.createdAt),
    excerpt: post.excerpt,
    id: post.id,
    publishedAt: toNullableIsoString(post.publishedAt),
    slug: post.slug,
    status: post.status,
    tags: tags.map((tag) => toTagSummary(tag)),
    title: post.title,
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
    postId: input.postId,
    revisionId: input.revisionId,
    token: input.token,
  } satisfies PreviewTokenResponse

  return PreviewTokenResponseSchema.parse(response)
}

export function toImageAsset(asset: ContentAssetRecord, momoPublicBaseUrl: string): ImageAsset {
  const imageAsset = {
    alt: asset.alt,
    createdAt: toIsoString(asset.createdAt),
    fileName: asset.fileName,
    fileUrl: resolveAssetFileUrl(asset, momoPublicBaseUrl),
    id: asset.id,
    mimeType: asset.mimeType,
    size: asset.size,
    storagePath: asset.storagePath,
    updatedAt: toIsoString(asset.updatedAt),
    url: asset.url,
  } satisfies ImageAsset

  return ImageAssetSchema.parse(imageAsset)
}

function resolveAssetFileUrl(asset: ContentAssetRecord, momoPublicBaseUrl: string): string {
  if (asset.url && isAbsoluteUrl(asset.url)) {
    return asset.url
  }

  return buildMomoAssetFileUrl(momoPublicBaseUrl, asset.id)
}

function buildMomoAssetFileUrl(momoPublicBaseUrl: string, assetId: string): string {
  return `${momoPublicBaseUrl.replace(/\/+$/, '')}/rpc/content/assets/${assetId}/file`
}

function isAbsoluteUrl(value: string): boolean {
  return URL.canParse(value)
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
