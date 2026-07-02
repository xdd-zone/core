import type { InferSelectModel } from 'drizzle-orm'
import type { contentAssets } from '#momo/infra/db/schema/index'

export type AssetRecord = Pick<
  InferSelectModel<typeof contentAssets>,
  'alt' | 'createdAt' | 'fileName' | 'id' | 'mimeType' | 'size' | 'storagePath' | 'updatedAt' | 'url'
>

export interface AssetReferenceRecord {
  postId: string
  postSlug: string
  postTitle: string
  relation: 'cover' | 'draft-source' | 'published-source'
}

export type CreateAssetInput = Pick<AssetRecord, 'alt' | 'fileName' | 'mimeType' | 'size' | 'storagePath' | 'url'> & {
  createdBy: string
  id: string
}

export interface UpdateAssetInput {
  alt: string | null
  id: string
  updatedAt: Date
}
