import { z } from 'zod'

export const ImageAssetSchema = z.object({
  alt: z.string().nullable(),
  createdAt: z.string(),
  fileName: z.string(),
  fileUrl: z.string().url(),
  id: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  storagePath: z.string(),
  updatedAt: z.string(),
  url: z.string().nullable(),
})

export const ImageAssetResponseSchema = z.object({
  asset: ImageAssetSchema,
})

export const AssetListQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  mimeType: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(24),
})

export const AssetListResponseSchema = z.object({
  assets: z.array(ImageAssetSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
})

export const AssetReferenceSchema = z.object({
  postId: z.string(),
  postSlug: z.string(),
  postTitle: z.string(),
  relation: z.enum(['cover', 'draft-source', 'published-source']),
})

export const AssetDetailResponseSchema = z.object({
  asset: ImageAssetSchema,
  references: z.array(AssetReferenceSchema),
})

export const UpdateAssetRequestSchema = z.object({
  alt: z.string().trim().max(200).nullable(),
})

export const DeleteAssetResponseSchema = z.object({
  assetId: z.string(),
})

export type AssetDetailResponse = z.infer<typeof AssetDetailResponseSchema>
export type AssetListQuery = z.infer<typeof AssetListQuerySchema>
export type AssetListResponse = z.infer<typeof AssetListResponseSchema>
export type AssetReference = z.infer<typeof AssetReferenceSchema>
export type DeleteAssetResponse = z.infer<typeof DeleteAssetResponseSchema>
export type ImageAsset = z.infer<typeof ImageAssetSchema>
export type ImageAssetResponse = z.infer<typeof ImageAssetResponseSchema>
export type UpdateAssetRequest = z.infer<typeof UpdateAssetRequestSchema>
