import { z } from 'zod'
import { OperationWarningSchema, POST_STATUS_VALUES } from '../content/content.contract'

export const ProjectStatusSchema = z.enum(POST_STATUS_VALUES)

export const ProjectDraftInputSchema = z.object({
  coverAssetId: z.string().trim().min(1).nullable().optional(),
  description: z.string().trim().max(1200).nullable().optional(),
  links: z
    .array(
      z.object({
        href: z.string().url(),
        label: z.string().trim().min(1).max(80),
      }),
    )
    .max(8)
    .optional(),
  order: z.number().int().nonnegative().optional(),
  slug: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(160),
})

export const ProjectBaseSchema = ProjectDraftInputSchema

export const CreateProjectRequestSchema = z.object({
  draft: ProjectDraftInputSchema,
})
export const SaveProjectDraftRequestSchema = z.object({
  draft: ProjectDraftInputSchema.partial(),
})

export const ProjectDraftSchema = z.object({
  coverAssetId: z.string().nullable(),
  description: z.string().nullable(),
  links: z.array(z.object({ href: z.string().url(), label: z.string() })),
  order: z.number().int().nonnegative(),
  slug: z.string(),
  title: z.string(),
})

export const ProjectPublishedSchema = z.object({
  coverAssetId: z.string().nullable(),
  description: z.string().nullable(),
  links: z.array(z.object({ href: z.string().url(), label: z.string() })),
  publishedAt: z.string().nullable(),
  slug: z.string().nullable(),
  title: z.string().nullable(),
})

export const ProjectSummarySchema = z.object({
  draft: ProjectDraftSchema,
  id: z.string(),
  published: ProjectPublishedSchema,
  status: ProjectStatusSchema,
  updatedAt: z.string(),
})

export const PublicProjectSummarySchema = z.object({
  coverAssetId: z.string().nullable(),
  description: z.string().nullable(),
  id: z.string(),
  links: z.array(z.object({ href: z.string().url(), label: z.string() })),
  order: z.number().int().nonnegative(),
  publishedAt: z.string().nullable(),
  slug: z.string(),
  title: z.string(),
  updatedAt: z.string(),
})

export const PublicProjectListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(8),
})

export const ProjectListResponseSchema = z.object({
  projects: z.array(ProjectSummarySchema),
})

export const ProjectResponseSchema = z.object({
  project: ProjectSummarySchema,
  warnings: z.array(OperationWarningSchema).optional(),
})

export const PublicProjectListResponseSchema = z.object({
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  projects: z.array(PublicProjectSummarySchema),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})

export const PublicProjectResponseSchema = z.object({
  project: PublicProjectSummarySchema,
})

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>
export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>
export type PublicProjectListResponse = z.infer<typeof PublicProjectListResponseSchema>
export type PublicProjectListQuery = z.infer<typeof PublicProjectListQuerySchema>
export type PublicProjectResponse = z.infer<typeof PublicProjectResponseSchema>
export type PublicProjectSummary = z.infer<typeof PublicProjectSummarySchema>
export type SaveProjectDraftRequest = z.infer<typeof SaveProjectDraftRequestSchema>
