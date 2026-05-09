import {
  createPaginatedListSchema,
  DateTimeSchema,
  intFromQuery,
  MarkdownSchema,
  SlugSchema,
} from '@nexus/shared/schema'
import { z } from 'zod'

export const PublicSiteConfigSchema = z.object({
  title: z.string(),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),
  logo: z.string().url('请输入有效的 logo URL').nullable(),
  favicon: z.string().url('请输入有效的 favicon URL').nullable(),
  footerText: z.string().nullable(),
  socialLinks: z.record(z.string(), z.string().url('请输入有效的 URL')),
  defaultSeoTitle: z.string().nullable(),
  defaultSeoDescription: z.string().nullable(),
})

export type PublicSiteConfig = z.infer<typeof PublicSiteConfigSchema>

export const PublicSiteCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: SlugSchema,
  description: z.string().nullable(),
  sortOrder: z.number().int(),
  postCount: z.number().int().min(0),
})

export type PublicSiteCategory = z.infer<typeof PublicSiteCategorySchema>

export const PublicSitePostCategorySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: SlugSchema,
  })
  .nullable()

export const PublicSitePostSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: SlugSchema,
  excerpt: z.string().nullable(),
  coverImage: z.string().url('请输入有效的封面 URL').nullable(),
  category: PublicSitePostCategorySchema,
  tags: z.array(z.string()),
  publishedAt: DateTimeSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
})

export type PublicSitePostSummary = z.infer<typeof PublicSitePostSummarySchema>

export const PublicSitePostSchema = PublicSitePostSummarySchema.extend({
  markdown: MarkdownSchema,
})

export type PublicSitePost = z.infer<typeof PublicSitePostSchema>

export const PublicSitePostListQuerySchema = z.object({
  page: intFromQuery('页码必须是整数').pipe(z.number().min(1, '页码必须大于 0').optional()),
  pageSize: intFromQuery('每页数量必须是整数').pipe(
    z.number().min(1, '每页数量必须大于 0').max(100, '每页数量不能超过 100').optional(),
  ),
  keyword: z.string().optional(),
  categoryId: z.string().optional(),
  categorySlug: SlugSchema.optional(),
  tag: z.string().optional(),
})

export type PublicSitePostListQuery = z.infer<typeof PublicSitePostListQuerySchema>

export const PublicSiteArchivePostListQuerySchema = z.object({
  year: intFromQuery('年份必须是整数').pipe(z.number().min(1970, '年份不能小于 1970').max(9999, '年份不能大于 9999')),
  month: intFromQuery('月份必须是整数').pipe(z.number().min(1, '月份必须大于 0').max(12, '月份不能大于 12').optional()),
  page: intFromQuery('页码必须是整数').pipe(z.number().min(1, '页码必须大于 0').optional()),
  pageSize: intFromQuery('每页数量必须是整数').pipe(
    z.number().min(1, '每页数量必须大于 0').max(100, '每页数量不能超过 100').optional(),
  ),
})

export type PublicSiteArchivePostListQuery = z.infer<typeof PublicSiteArchivePostListQuerySchema>

export const PublicSiteCategoryListQuerySchema = z.object({
  keyword: z.string().optional(),
})

export type PublicSiteCategoryListQuery = z.infer<typeof PublicSiteCategoryListQuerySchema>

export const PublicSitePostSlugParamsSchema = z.object({
  slug: SlugSchema,
})

export type PublicSitePostSlugParams = z.infer<typeof PublicSitePostSlugParamsSchema>

export const PublicSiteCategorySlugParamsSchema = z.object({
  slug: SlugSchema,
})

export type PublicSiteCategorySlugParams = z.infer<typeof PublicSiteCategorySlugParamsSchema>

export const PublicSitePostListSchema = createPaginatedListSchema(PublicSitePostSummarySchema)
export type PublicSitePostList = z.infer<typeof PublicSitePostListSchema>

export const PublicSiteCategoryListSchema = z.array(PublicSiteCategorySchema)
export type PublicSiteCategoryList = z.infer<typeof PublicSiteCategoryListSchema>

export const PublicSiteArchiveMonthSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  count: z.number().int().min(0),
})

export type PublicSiteArchiveMonth = z.infer<typeof PublicSiteArchiveMonthSchema>

export const PublicSiteArchiveYearSchema = z.object({
  year: z.number().int(),
  count: z.number().int().min(0),
  months: z.array(PublicSiteArchiveMonthSchema),
})

export type PublicSiteArchiveYear = z.infer<typeof PublicSiteArchiveYearSchema>

export const PublicSiteArchiveListSchema = z.object({
  items: z.array(PublicSiteArchiveYearSchema),
})

export type PublicSiteArchiveList = z.infer<typeof PublicSiteArchiveListSchema>
