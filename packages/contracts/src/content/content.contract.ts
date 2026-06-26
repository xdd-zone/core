import { z } from 'zod'

export const POST_STATUS_VALUES = ['draft', 'published', 'archived'] as const

export const PostStatusSchema = z.enum(POST_STATUS_VALUES)

export const ContentPostBaseSchema = z.object({
  coverAssetId: z.string().trim().min(1).nullable().optional(),
  excerpt: z.string().trim().max(500).nullable().optional(),
  slug: z.string().trim().min(1).max(160),
  source: z.string().min(1),
  title: z.string().trim().min(1).max(160),
})

export const CreatePostRequestSchema = ContentPostBaseSchema
export const SavePostDraftRequestSchema = ContentPostBaseSchema.partial().extend({
  source: z.string().min(1).optional(),
})

export const PostSummarySchema = z.object({
  coverAssetId: z.string().nullable(),
  createdAt: z.string(),
  excerpt: z.string().nullable(),
  id: z.string(),
  publishedAt: z.string().nullable(),
  slug: z.string(),
  status: PostStatusSchema,
  title: z.string(),
  updatedAt: z.string(),
})

export const PostDetailSchema = PostSummarySchema.extend({
  draftRevisionId: z.string().nullable(),
  publishedRevisionId: z.string().nullable(),
  source: z.string(),
})

export const PostRevisionSchema = z.object({
  createdAt: z.string(),
  excerpt: z.string().nullable(),
  id: z.string(),
  postId: z.string(),
  revisionNo: z.number().int().positive(),
  source: z.string(),
  title: z.string(),
})

export const PostListResponseSchema = z.object({
  posts: z.array(PostSummarySchema),
})

export const PostDetailResponseSchema = z.object({
  post: PostDetailSchema,
})

export const PreviewTokenResponseSchema = z.object({
  expiresAt: z.string(),
  postId: z.string(),
  revisionId: z.string(),
  token: z.string(),
})

export const PublicPostResponseSchema = z.object({
  post: PostDetailSchema,
})

export const PreviewPostResponseSchema = z.object({
  post: PostDetailSchema,
  revision: PostRevisionSchema,
})

export const MdxComponentSchema = z.object({
  description: z.string(),
  name: z.string(),
  snippet: z.string(),
})

export const MdxComponentsResponseSchema = z.object({
  components: z.array(MdxComponentSchema),
})

export const ImageAssetSchema = z.object({
  alt: z.string().nullable(),
  createdAt: z.string(),
  fileName: z.string(),
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
export type CreatePostRequest = z.infer<typeof CreatePostRequestSchema>
export type DeleteAssetResponse = z.infer<typeof DeleteAssetResponseSchema>
export type ImageAsset = z.infer<typeof ImageAssetSchema>
export type ImageAssetResponse = z.infer<typeof ImageAssetResponseSchema>
export type MdxComponent = z.infer<typeof MdxComponentSchema>
export type MdxComponentsResponse = z.infer<typeof MdxComponentsResponseSchema>
export type PostDetail = z.infer<typeof PostDetailSchema>
export type PostDetailResponse = z.infer<typeof PostDetailResponseSchema>
export type PostListResponse = z.infer<typeof PostListResponseSchema>
export type PostRevision = z.infer<typeof PostRevisionSchema>
export type PostStatus = z.infer<typeof PostStatusSchema>
export type PostSummary = z.infer<typeof PostSummarySchema>
export type PreviewPostResponse = z.infer<typeof PreviewPostResponseSchema>
export type PreviewTokenResponse = z.infer<typeof PreviewTokenResponseSchema>
export type PublicPostResponse = z.infer<typeof PublicPostResponseSchema>
export type SavePostDraftRequest = z.infer<typeof SavePostDraftRequestSchema>
export type UpdateAssetRequest = z.infer<typeof UpdateAssetRequestSchema>
