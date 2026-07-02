import { z } from 'zod'
import { OperationWarningSchema, POST_STATUS_VALUES } from '../content/content.contract'

export const ProjectStatusSchema = z.enum(POST_STATUS_VALUES)

export const ProjectBaseSchema = z.object({
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

export const CreateProjectRequestSchema = ProjectBaseSchema
export const SaveProjectDraftRequestSchema = ProjectBaseSchema.partial()

export const ProjectSummarySchema = z.object({
  coverAssetId: z.string().nullable(),
  description: z.string().nullable(),
  id: z.string(),
  links: z.array(z.object({ href: z.string().url(), label: z.string() })),
  order: z.number().int().nonnegative(),
  publishedAt: z.string().nullable(),
  slug: z.string(),
  status: ProjectStatusSchema,
  title: z.string(),
  updatedAt: z.string(),
})

export const PublicProjectSummarySchema = ProjectSummarySchema.omit({
  status: true,
})

export const ProjectListResponseSchema = z.object({
  projects: z.array(ProjectSummarySchema),
})

export const ProjectResponseSchema = z.object({
  project: ProjectSummarySchema,
  warnings: z.array(OperationWarningSchema).optional(),
})

export const PublicProjectListResponseSchema = z.object({
  projects: z.array(PublicProjectSummarySchema),
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
export type PublicProjectResponse = z.infer<typeof PublicProjectResponseSchema>
export type PublicProjectSummary = z.infer<typeof PublicProjectSummarySchema>
export type SaveProjectDraftRequest = z.infer<typeof SaveProjectDraftRequestSchema>
