import {
  ContentStatusSchema,
  createPaginatedListSchema,
  DateTimeSchema,
  intFromQuery,
  MarkdownSchema,
  SlugSchema,
} from '@nexus/shared/schema'
import { z } from 'zod'

function TrimmedRequiredStringSchema(emptyMessage: string, maxLength: number, maxLengthMessage: string) {
  return z.string().trim().min(1, emptyMessage).max(maxLength, maxLengthMessage)
}

function TrimmedOptionalNullableStringSchema<T extends z.ZodString>(schema: T) {
  return schema.nullable().optional()
}

const TrimmedMarkdownSchema = MarkdownSchema.trim().min(1, 'Markdown 内容不能为空')
const TagSchema = z.string().trim().min(1, '标签不能为空').max(30, '标签最多 30 个字符')
const PostExcerptSchema = z.string().trim().max(300, '摘要最多 300 个字符')
const PostCategorySchema = z.string().trim().max(50, '分类最多 50 个字符')

export const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: SlugSchema,
  markdown: MarkdownSchema,
  excerpt: z.string().nullable(),
  coverImage: z.string().url('请输入有效的封面 URL').nullable(),
  status: ContentStatusSchema,
  category: z.string().nullable(),
  tags: z.array(z.string()),
  publishedAt: DateTimeSchema.nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
})

export type Post = z.infer<typeof PostSchema>

export const CreatePostBodySchema = z.object({
  title: TrimmedRequiredStringSchema('标题不能为空', 200, '标题最多 200 个字符'),
  slug: SlugSchema,
  markdown: TrimmedMarkdownSchema,
  excerpt: TrimmedOptionalNullableStringSchema(PostExcerptSchema),
  coverImage: z.string().url('请输入有效的封面 URL').nullable().optional(),
  category: TrimmedOptionalNullableStringSchema(PostCategorySchema),
  tags: z.array(TagSchema).max(20, '标签最多 20 个').default([]),
})

export type CreatePostBody = z.infer<typeof CreatePostBodySchema>

export const UpdatePostBodySchema = z
  .object({
    title: TrimmedRequiredStringSchema('标题不能为空', 200, '标题最多 200 个字符').optional(),
    slug: SlugSchema.optional(),
    markdown: TrimmedMarkdownSchema.optional(),
    excerpt: TrimmedOptionalNullableStringSchema(PostExcerptSchema),
    coverImage: z.string().url('请输入有效的封面 URL').nullable().optional(),
    category: TrimmedOptionalNullableStringSchema(PostCategorySchema),
    tags: z.array(TagSchema).max(20, '标签最多 20 个').optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: '至少提供一个更新字段',
  })

export type UpdatePostBody = z.infer<typeof UpdatePostBodySchema>

export const PostIdParamsSchema = z.object({
  id: z.string().min(1, '文章 ID 不能为空'),
})

export type PostIdParams = z.infer<typeof PostIdParamsSchema>

export const PostListQuerySchema = z.object({
  page: intFromQuery('页码必须是整数').pipe(z.number().min(1, '页码必须大于 0').optional()),
  pageSize: intFromQuery('每页数量必须是整数').pipe(
    z.number().min(1, '每页数量必须大于 0').max(100, '每页数量不能超过 100').optional(),
  ),
  keyword: z.string().optional(),
  status: ContentStatusSchema.optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
})

export type PostListQuery = z.infer<typeof PostListQuerySchema>

export const PostListSchema = createPaginatedListSchema(PostSchema)
export type PostList = z.infer<typeof PostListSchema>
