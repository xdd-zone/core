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

export const AssetReferenceStatusSchema = z.enum(['all', 'referenced', 'unreferenced'])

export const AssetListQuerySchema = z.object({
  createdFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  createdTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  keyword: z.string().trim().optional(),
  mimeType: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(24),
  referenceStatus: AssetReferenceStatusSchema.default('all'),
})

export const AssetListItemSchema = ImageAssetSchema.extend({
  referenceCount: z.number().int().nonnegative(),
})

export const AssetListResponseSchema = z.object({
  assets: z.array(AssetListItemSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
})

export const AssetReferenceSchema = z.object({
  relation: z.enum(['avatar', 'draft-cover', 'published-cover', 'draft-source', 'published-source']),
  targetId: z.string(),
  targetSlug: z.string(),
  targetTitle: z.string(),
  targetType: z.enum(['post', 'profile', 'project']),
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

export const AssetCleanupRequestSchema = AssetListQuerySchema.omit({ page: true, pageSize: true })

export const AssetCleanupPreviewResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  totalSize: z.number().int().nonnegative(),
})

export const AssetCleanupResponseSchema = z.object({
  deleted: z.number().int().nonnegative(),
  releasedSize: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
})

export type AssetDetailResponse = z.infer<typeof AssetDetailResponseSchema>
export type AssetCleanupPreviewResponse = z.infer<typeof AssetCleanupPreviewResponseSchema>
export type AssetCleanupRequest = z.infer<typeof AssetCleanupRequestSchema>
export type AssetCleanupResponse = z.infer<typeof AssetCleanupResponseSchema>
export type AssetListItem = z.infer<typeof AssetListItemSchema>
export type AssetListQuery = z.infer<typeof AssetListQuerySchema>
export type AssetListResponse = z.infer<typeof AssetListResponseSchema>
export type AssetReference = z.infer<typeof AssetReferenceSchema>
export type AssetReferenceStatus = z.infer<typeof AssetReferenceStatusSchema>
export type DeleteAssetResponse = z.infer<typeof DeleteAssetResponseSchema>
export type ImageAsset = z.infer<typeof ImageAssetSchema>
export type ImageAssetResponse = z.infer<typeof ImageAssetResponseSchema>
export type UpdateAssetRequest = z.infer<typeof UpdateAssetRequestSchema>
