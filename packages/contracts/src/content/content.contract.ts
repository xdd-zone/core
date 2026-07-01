import { z } from 'zod'

export const POST_STATUS_VALUES = ['draft', 'published', 'archived'] as const

export const PostStatusSchema = z.enum(POST_STATUS_VALUES)

export const TaxonomySlugSchema = z.string().trim().min(1).max(160)

export const ContentPostBaseSchema = z.object({
  categoryId: z.string().trim().min(1).nullable().optional(),
  coverAssetId: z.string().trim().min(1).nullable().optional(),
  excerpt: z.string().trim().max(500).nullable().optional(),
  slug: z.string().trim().min(1).max(160),
  source: z.string().min(1),
  tagIds: z.array(z.string().trim().min(1)).max(50).optional(),
  title: z.string().trim().min(1).max(160),
})

export const CreatePostRequestSchema = ContentPostBaseSchema
export const SavePostDraftRequestSchema = ContentPostBaseSchema.partial().extend({
  source: z.string().min(1).optional(),
})

export const GeneratePostMetaTargetSchema = z.enum(['slug', 'excerpt', 'title'])

export const GeneratePostMetaRequestSchema = z.object({
  excerpt: z.string().trim().max(500).nullable().optional(),
  locale: z.enum(['zh-CN', 'en-US']).default('zh-CN'),
  mode: z.enum(['create', 'edit']),
  postId: z.string().trim().min(1).optional(),
  slug: z.string().trim().max(160).optional(),
  source: z.string().optional(),
  targets: z.array(GeneratePostMetaTargetSchema).min(1).max(3),
  title: z.string().trim().max(160).optional(),
})

export const GeneratePostMetaSuggestionSchema = z.object({
  excerpt: z.string().max(500).optional(),
  slug: z.string().max(160).optional(),
  slugAvailable: z.boolean().optional(),
  title: z.string().max(160).optional(),
})

export const GeneratePostMetaUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
})

export const GeneratePostMetaResponseSchema = z.object({
  suggestion: GeneratePostMetaSuggestionSchema,
  usage: GeneratePostMetaUsageSchema.optional(),
})

export const CategorySummarySchema = z.object({
  description: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  slug: z.string(),
})

export const TagSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
})

export const PostSummarySchema = z.object({
  category: CategorySummarySchema.nullable(),
  coverAssetId: z.string().nullable(),
  createdAt: z.string(),
  excerpt: z.string().nullable(),
  id: z.string(),
  publishedAt: z.string().nullable(),
  slug: z.string(),
  status: PostStatusSchema,
  tags: z.array(TagSummarySchema),
  title: z.string(),
  updatedAt: z.string(),
})

export const PostDetailSchema = PostSummarySchema.extend({
  draftRevisionId: z.string().nullable(),
  publishedRevisionId: z.string().nullable(),
  source: z.string(),
})

export const PublicCategorySchema = CategorySummarySchema

export const PublicCategoryListItemSchema = CategorySummarySchema.extend({
  postCount: z.number().int().nonnegative(),
})

export const PublicTagSchema = TagSummarySchema

export const PublicPostSummarySchema = z.object({
  category: PublicCategorySchema.nullable(),
  coverAssetId: z.string().nullable(),
  excerpt: z.string().nullable(),
  id: z.string(),
  publishedAt: z.string().nullable(),
  slug: z.string(),
  tags: z.array(PublicTagSchema),
  title: z.string(),
  updatedAt: z.string(),
})

export const PublicPostDetailSchema = PublicPostSummarySchema.extend({
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
  post: PublicPostDetailSchema,
})

export const PublicPostListResponseSchema = z.object({
  posts: z.array(PublicPostSummarySchema),
})

export const PublicCategoryListResponseSchema = z.object({
  categories: z.array(PublicCategoryListItemSchema),
})

export const PublicTagListResponseSchema = z.object({
  tags: z.array(PublicTagSchema),
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

export const CreateCategoryRequestSchema = z.object({
  description: z.string().trim().max(500).nullable().optional(),
  name: z.string().trim().min(1).max(120),
  slug: TaxonomySlugSchema,
})

export const UpdateCategoryRequestSchema = z.object({
  description: z.string().trim().max(500).nullable().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  slug: TaxonomySlugSchema.optional(),
})

export const CreateTagRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: TaxonomySlugSchema,
})

export const UpdateTagRequestSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  slug: TaxonomySlugSchema.optional(),
})

export const CategorySchema = z.object({
  createdAt: z.string(),
  description: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  postCount: z.number().int().nonnegative(),
  slug: z.string(),
  updatedAt: z.string(),
})

export const TagSchema = z.object({
  createdAt: z.string(),
  id: z.string(),
  name: z.string(),
  postCount: z.number().int().nonnegative(),
  slug: z.string(),
  updatedAt: z.string(),
})

export const CategoryResponseSchema = z.object({
  category: CategorySchema,
})

export const CategoryListResponseSchema = z.object({
  categories: z.array(CategorySchema),
})

export const TagResponseSchema = z.object({
  tag: TagSchema,
})

export const TagListResponseSchema = z.object({
  tags: z.array(TagSchema),
})

export const DeleteCategoryResponseSchema = z.object({
  categoryId: z.string(),
})

export const DeleteTagResponseSchema = z.object({
  tagId: z.string(),
})

export const PublicPostListQuerySchema = z.object({
  categorySlug: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
  tagSlug: z.string().trim().optional(),
})

export type AssetDetailResponse = z.infer<typeof AssetDetailResponseSchema>
export type AssetListQuery = z.infer<typeof AssetListQuerySchema>
export type AssetListResponse = z.infer<typeof AssetListResponseSchema>
export type AssetReference = z.infer<typeof AssetReferenceSchema>
export type Category = z.infer<typeof CategorySchema>
export type CategoryListResponse = z.infer<typeof CategoryListResponseSchema>
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>
export type CategorySummary = z.infer<typeof CategorySummarySchema>
export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>
export type CreatePostRequest = z.infer<typeof CreatePostRequestSchema>
export type GeneratePostMetaRequest = z.infer<typeof GeneratePostMetaRequestSchema>
export type GeneratePostMetaResponse = z.infer<typeof GeneratePostMetaResponseSchema>
export type GeneratePostMetaSuggestion = z.infer<typeof GeneratePostMetaSuggestionSchema>
export type GeneratePostMetaTarget = z.infer<typeof GeneratePostMetaTargetSchema>
export type CreateTagRequest = z.infer<typeof CreateTagRequestSchema>
export type DeleteAssetResponse = z.infer<typeof DeleteAssetResponseSchema>
export type DeleteCategoryResponse = z.infer<typeof DeleteCategoryResponseSchema>
export type DeleteTagResponse = z.infer<typeof DeleteTagResponseSchema>
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
export type PublicCategory = z.infer<typeof PublicCategorySchema>
export type PublicCategoryListItem = z.infer<typeof PublicCategoryListItemSchema>
export type PublicCategoryListResponse = z.infer<typeof PublicCategoryListResponseSchema>
export type PublicPostDetail = z.infer<typeof PublicPostDetailSchema>
export type PublicPostListResponse = z.infer<typeof PublicPostListResponseSchema>
export type PublicPostListQuery = z.infer<typeof PublicPostListQuerySchema>
export type PublicPostResponse = z.infer<typeof PublicPostResponseSchema>
export type PublicPostSummary = z.infer<typeof PublicPostSummarySchema>
export type PublicTag = z.infer<typeof PublicTagSchema>
export type PublicTagListResponse = z.infer<typeof PublicTagListResponseSchema>
export type SavePostDraftRequest = z.infer<typeof SavePostDraftRequestSchema>
export type Tag = z.infer<typeof TagSchema>
export type TagListResponse = z.infer<typeof TagListResponseSchema>
export type TagResponse = z.infer<typeof TagResponseSchema>
export type TagSummary = z.infer<typeof TagSummarySchema>
export type UpdateAssetRequest = z.infer<typeof UpdateAssetRequestSchema>
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>
export type UpdateTagRequest = z.infer<typeof UpdateTagRequestSchema>
