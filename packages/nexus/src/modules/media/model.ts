import { createPaginatedListSchema, DateTimeSchema, intFromQuery } from '@nexus/shared/schema'
import { t } from 'elysia'
import { z } from 'zod'

export const MediaSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  url: z.string().min(1, '媒体地址不能为空'),
  uploadedBy: z.string().nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
})

export type Media = z.infer<typeof MediaSchema>

export const MediaListQuerySchema = z.object({
  page: intFromQuery('页码必须是整数').pipe(z.number().min(1, '页码必须大于 0').optional()),
  pageSize: intFromQuery('每页数量必须是整数').pipe(
    z.number().min(1, '每页数量必须大于 0').max(100, '每页数量不能超过 100').optional(),
  ),
})

export type MediaListQuery = z.infer<typeof MediaListQuerySchema>

export const MediaListSchema = createPaginatedListSchema(MediaSchema)
export type MediaList = z.infer<typeof MediaListSchema>

export const MediaIdParamsSchema = z.object({
  id: z.string().min(1, '媒体 ID 不能为空'),
})

export type MediaIdParams = z.infer<typeof MediaIdParamsSchema>

export const UploadMediaBodySchema = t.Object({
  file: t.File({
    maxSize: '10m',
  }),
})
