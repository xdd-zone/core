import type { InferSelectModel } from 'drizzle-orm'
import type { contentPostRevisions, contentPosts, contentPreviewTokens } from '#momo/infra/db/schema/index'

export type ContentPostRecord = InferSelectModel<typeof contentPosts>
export type ContentRevisionRecord = InferSelectModel<typeof contentPostRevisions>
export type ContentPreviewTokenRecord = InferSelectModel<typeof contentPreviewTokens>

export interface CreateContentPostInput {
  categoryId?: string | null
  coverAssetId?: string | null
  excerpt?: string | null
  id: string
  revisionId: string
  slug: string
  source: string
  tagIds?: string[]
  title: string
  userId: string
}

export interface SaveContentDraftInput {
  categoryId?: string | null
  coverAssetId?: string | null
  excerpt?: string | null
  id: string
  revisionId: string
  slug?: string
  source: string
  tagIds?: string[]
  title?: string
  userId: string
}

export interface PublishContentPostInput {
  eventId: string
  postId: string
  userId: string
}

export interface ArchiveContentPostInput {
  eventId: string
  postId: string
  userId: string
}

export type PublishContentPostResult =
  | {
      status: 'not_found'
    }
  | {
      status: 'missing_draft_revision'
    }
  | {
      status: 'no_draft'
    }
  | {
      eventId: string
      post: ContentPostRecord
      revision: ContentRevisionRecord
      status: 'published'
    }

export interface CreateContentPreviewTokenInput {
  createdBy: string
  expiresAt: Date
  id: string
  targetId: string
  targetType: 'post' | 'project' | 'site-page'
  tokenHash: string
}

export interface ListPublicPostsInput {
  categorySlug?: string
  limit?: number
  offset?: number
  tagSlug?: string
}
