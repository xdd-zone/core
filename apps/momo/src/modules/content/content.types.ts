import type { InferSelectModel } from 'drizzle-orm'
import type {
  contentAssets,
  contentPostRevisions,
  contentPosts,
  contentPreviewTokens,
} from '#momo/infra/db/schema/index'

export type ContentPostRecord = InferSelectModel<typeof contentPosts>
export type ContentRevisionRecord = InferSelectModel<typeof contentPostRevisions>
export type ContentPreviewTokenRecord = InferSelectModel<typeof contentPreviewTokens>

export type ContentAssetRecord = Pick<
  InferSelectModel<typeof contentAssets>,
  'alt' | 'fileName' | 'id' | 'mimeType' | 'size' | 'storagePath' | 'url'
>

export type ContentAssetReferenceRecord = Pick<InferSelectModel<typeof contentAssets>, 'id'>

export interface CreateContentPostInput {
  coverAssetId?: string | null
  excerpt?: string | null
  id: string
  revisionId: string
  slug: string
  source: string
  title: string
  userId: string
}

export interface SaveContentDraftInput {
  coverAssetId?: string | null
  excerpt?: string | null
  id: string
  revisionId: string
  slug?: string
  source: string
  title?: string
  userId: string
}

export interface PublishContentPostInput {
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
      post: ContentPostRecord
      revision: ContentRevisionRecord
      status: 'published'
    }

export interface CreateContentPreviewTokenInput {
  createdBy: string
  expiresAt: Date
  id: string
  postId: string
  revisionId: string
  tokenHash: string
}

export type CreateContentAssetInput = ContentAssetRecord & {
  createdBy: string
}
