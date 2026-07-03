import type { InferSelectModel } from 'drizzle-orm'
import type { assets } from '#momo/infra/db/schema/index'

export type AssetRecord = Pick<
  InferSelectModel<typeof assets>,
  'alt' | 'createdAt' | 'fileName' | 'id' | 'mimeType' | 'size' | 'storagePath' | 'updatedAt' | 'url'
>

export interface AssetReferenceRecord {
  relation: 'draft-cover' | 'published-cover' | 'draft-source' | 'published-source'
  targetId: string
  targetSlug: string | null
  targetTitle: string | null
  targetType: 'post' | 'project'
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
