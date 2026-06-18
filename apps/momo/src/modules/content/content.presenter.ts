import type { ImageAsset, PostDetail, PostRevision, PostSummary, PreviewTokenResponse } from '@xdd-zone/contracts'
import type { ContentAssetRecord, ContentPostRecord, ContentRevisionRecord } from './content.types'
import {
  ImageAssetSchema,
  PostDetailSchema,
  PostRevisionSchema,
  PostSummarySchema,
  PreviewTokenResponseSchema,
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

export function toPostSummary(post: PostSummarySource): PostSummary {
  const summary = {
    coverAssetId: post.coverAssetId,
    createdAt: toIsoString(post.createdAt),
    excerpt: post.excerpt,
    id: post.id,
    publishedAt: toNullableIsoString(post.publishedAt),
    slug: post.slug,
    status: post.status,
    title: post.title,
    updatedAt: toIsoString(post.updatedAt),
  } satisfies PostSummary

  return PostSummarySchema.parse(summary)
}

export function toPostDetail(post: PostDetailSource, source: string): PostDetail {
  const detail = {
    ...toPostSummary(post),
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

export function toImageAsset(asset: ContentAssetRecord): ImageAsset {
  const imageAsset = {
    alt: asset.alt,
    fileName: asset.fileName,
    id: asset.id,
    mimeType: asset.mimeType,
    size: asset.size,
    storagePath: asset.storagePath,
    url: asset.url,
  } satisfies ImageAsset

  return ImageAssetSchema.parse(imageAsset)
}

function toIsoString(date: Date): string {
  return date.toISOString()
}

function toNullableIsoString(date: Date | null): string | null {
  return date?.toISOString() ?? null
}
