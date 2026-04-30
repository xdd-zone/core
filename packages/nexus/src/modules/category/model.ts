import { booleanish, createPaginatedListSchema, DateTimeSchema, intFromQuery, SlugSchema } from '@nexus/shared/schema'
import { z } from 'zod'

const CategoryNameSchema = z.string().trim().min(1, '分类名称不能为空').max(80, '分类名称最多 80 个字符')
const CategoryDescriptionSchema = z.string().trim().max(300, '分类说明最多 300 个字符')

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: SlugSchema,
  description: z.string().nullable(),
  sortOrder: z.number().int(),
  isVisible: z.boolean(),
  postCount: z.number().int().min(0),
  publishedPostCount: z.number().int().min(0),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
})

export type Category = z.infer<typeof CategorySchema>

export const PublicCategorySchema = CategorySchema.pick({
  id: true,
  name: true,
  slug: true,
  description: true,
  sortOrder: true,
  postCount: true,
})

export type PublicCategory = z.infer<typeof PublicCategorySchema>

export const CreateCategoryBodySchema = z.object({
  name: CategoryNameSchema,
  slug: SlugSchema.optional(),
  description: CategoryDescriptionSchema.nullable().optional(),
  sortOrder: z.number().int('排序值必须是整数').optional(),
  isVisible: z.boolean().optional(),
})

export type CreateCategoryBody = z.infer<typeof CreateCategoryBodySchema>

export const UpdateCategoryBodySchema = z
  .object({
    name: CategoryNameSchema.optional(),
    slug: SlugSchema.optional(),
    description: CategoryDescriptionSchema.nullable().optional(),
    sortOrder: z.number().int('排序值必须是整数').optional(),
    isVisible: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: '至少提供一个更新字段',
  })

export type UpdateCategoryBody = z.infer<typeof UpdateCategoryBodySchema>

export const CategoryIdParamsSchema = z.object({
  id: z.string().min(1, '分类 ID 不能为空'),
})

export type CategoryIdParams = z.infer<typeof CategoryIdParamsSchema>

export const CategoryListQuerySchema = z.object({
  page: intFromQuery('页码必须是整数').pipe(z.number().min(1, '页码必须大于 0').optional()),
  pageSize: intFromQuery('每页数量必须是整数').pipe(
    z.number().min(1, '每页数量必须大于 0').max(100, '每页数量不能超过 100').optional(),
  ),
  keyword: z.string().optional(),
  isVisible: booleanish(),
})

export type CategoryListQuery = z.infer<typeof CategoryListQuerySchema>

export const PublicCategoryListQuerySchema = z.object({
  keyword: z.string().optional(),
})

export type PublicCategoryListQuery = z.infer<typeof PublicCategoryListQuerySchema>

export const CategoryListSchema = createPaginatedListSchema(CategorySchema)
export type CategoryList = z.infer<typeof CategoryListSchema>

export const PublicCategoryListSchema = z.array(PublicCategorySchema)
export type PublicCategoryList = z.infer<typeof PublicCategoryListSchema>
