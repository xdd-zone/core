import {
  booleanish,
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
const PageExcerptSchema = z.string().trim().max(300, '摘要最多 300 个字符')

export const PageListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: SlugSchema,
  excerpt: z.string().nullable(),
  coverImage: z.string().url('请输入有效的封面 URL').nullable(),
  status: ContentStatusSchema,
  showInNavigation: z.boolean(),
  sortOrder: z.number().int(),
  publishedAt: DateTimeSchema.nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
})

export type PageListItem = z.infer<typeof PageListItemSchema>

export const PageSchema = PageListItemSchema.extend({
  markdown: MarkdownSchema,
})

export type Page = z.infer<typeof PageSchema>

export const CreatePageBodySchema = z.object({
  title: TrimmedRequiredStringSchema('标题不能为空', 200, '标题最多 200 个字符'),
  slug: SlugSchema,
  markdown: TrimmedMarkdownSchema,
  excerpt: TrimmedOptionalNullableStringSchema(PageExcerptSchema),
  coverImage: z.string().url('请输入有效的封面 URL').nullable().optional(),
  showInNavigation: z.boolean().default(false),
  sortOrder: z.number().int('排序值必须是整数').default(0),
})

export type CreatePageBody = z.infer<typeof CreatePageBodySchema>

export const UpdatePageBodySchema = z
  .object({
    title: TrimmedRequiredStringSchema('标题不能为空', 200, '标题最多 200 个字符').optional(),
    slug: SlugSchema.optional(),
    markdown: TrimmedMarkdownSchema.optional(),
    excerpt: TrimmedOptionalNullableStringSchema(PageExcerptSchema),
    coverImage: z.string().url('请输入有效的封面 URL').nullable().optional(),
    showInNavigation: z.boolean().optional(),
    sortOrder: z.number().int('排序值必须是整数').optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: '至少提供一个更新字段',
  })

export type UpdatePageBody = z.infer<typeof UpdatePageBodySchema>

export const PageIdParamsSchema = z.object({
  id: z.string().min(1, '页面 ID 不能为空'),
})

export type PageIdParams = z.infer<typeof PageIdParamsSchema>

export const PageListQuerySchema = z.object({
  page: intFromQuery('页码必须是整数').pipe(z.number().min(1, '页码必须大于 0').optional()),
  pageSize: intFromQuery('每页数量必须是整数').pipe(
    z.number().min(1, '每页数量必须大于 0').max(100, '每页数量不能超过 100').optional(),
  ),
  keyword: z.string().optional(),
  status: ContentStatusSchema.optional(),
  showInNavigation: booleanish(),
})

export type PageListQuery = z.infer<typeof PageListQuerySchema>

export const PageListSchema = createPaginatedListSchema(PageListItemSchema)
export type PageList = z.infer<typeof PageListSchema>
