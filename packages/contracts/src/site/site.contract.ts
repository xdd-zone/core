import { z } from 'zod'

export const SITE_KEY_VALUES = ['bobo'] as const

export const SiteKeySchema = z.enum(SITE_KEY_VALUES)

export const SiteNavigationItemSchema = z.object({
  href: z.string().trim().min(1).max(240),
  id: z.string().trim().min(1),
  label: z.string().trim().min(1).max(80),
  order: z.number().int().nonnegative(),
  visible: z.boolean(),
})

export const SiteHomeSectionSchema = z.object({
  id: z.string().trim().min(1),
  order: z.number().int().nonnegative(),
  type: z.enum(['writing', 'projects', 'profile']),
  visible: z.boolean(),
})

export const SiteSeoDefaultsSchema = z.object({
  description: z.string().trim().max(300).nullable(),
  title: z.string().trim().min(1).max(120),
})

export const SiteConfigSchema = z.object({
  homeSections: z.array(SiteHomeSectionSchema),
  navigation: z.array(SiteNavigationItemSchema),
  seo: SiteSeoDefaultsSchema,
  siteKey: SiteKeySchema,
  updatedAt: z.string(),
})

export const UpdateSiteConfigRequestSchema = z.object({
  homeSections: z.array(SiteHomeSectionSchema).optional(),
  navigation: z.array(SiteNavigationItemSchema).optional(),
  seo: SiteSeoDefaultsSchema.optional(),
})

export const SiteConfigResponseSchema = z.object({
  site: SiteConfigSchema,
})

export type SiteConfig = z.infer<typeof SiteConfigSchema>
export type SiteConfigResponse = z.infer<typeof SiteConfigResponseSchema>
export type SiteHomeSection = z.infer<typeof SiteHomeSectionSchema>
export type SiteKey = z.infer<typeof SiteKeySchema>
export type SiteNavigationItem = z.infer<typeof SiteNavigationItemSchema>
export type SiteSeoDefaults = z.infer<typeof SiteSeoDefaultsSchema>
export type UpdateSiteConfigRequest = z.infer<typeof UpdateSiteConfigRequestSchema>
