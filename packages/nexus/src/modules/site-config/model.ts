import { DateTimeSchema } from '@nexus/shared/schema'
import { z } from 'zod'

function TrimmedRequiredStringSchema(emptyMessage: string, maxLength: number, maxLengthMessage: string) {
  return z.string().trim().min(1, emptyMessage).max(maxLength, maxLengthMessage)
}

function TrimmedOptionalNullableStringSchema<T extends z.ZodString>(schema: T) {
  return schema.nullable().optional()
}

const SiteTextSchema = z.string().trim().max(200, '内容最多 200 个字符')
const SiteDescriptionSchema = z.string().trim().max(500, '描述最多 500 个字符')
const SiteUrlSchema = z.string().url('请输入有效的 URL')

export const SiteSocialLinksSchema = z.record(z.string().trim().min(1, '社交平台名称不能为空'), SiteUrlSchema)

export type SiteSocialLinks = z.infer<typeof SiteSocialLinksSchema>

export const SiteConfigSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),
  logo: z.string().url('请输入有效的 logo URL').nullable(),
  favicon: z.string().url('请输入有效的 favicon URL').nullable(),
  footerText: z.string().nullable(),
  socialLinks: SiteSocialLinksSchema,
  defaultSeoTitle: z.string().nullable(),
  defaultSeoDescription: z.string().nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
})

export type SiteConfig = z.infer<typeof SiteConfigSchema>

export const UpdateSiteConfigBodySchema = z
  .object({
    title: TrimmedRequiredStringSchema('站点标题不能为空', 200, '站点标题最多 200 个字符').optional(),
    subtitle: TrimmedOptionalNullableStringSchema(SiteTextSchema),
    description: TrimmedOptionalNullableStringSchema(SiteDescriptionSchema),
    logo: SiteUrlSchema.nullable().optional(),
    favicon: SiteUrlSchema.nullable().optional(),
    footerText: TrimmedOptionalNullableStringSchema(SiteTextSchema),
    socialLinks: SiteSocialLinksSchema.optional(),
    defaultSeoTitle: TrimmedOptionalNullableStringSchema(SiteTextSchema),
    defaultSeoDescription: TrimmedOptionalNullableStringSchema(SiteDescriptionSchema),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: '至少提供一个更新字段',
  })

export type UpdateSiteConfigBody = z.infer<typeof UpdateSiteConfigBodySchema>
