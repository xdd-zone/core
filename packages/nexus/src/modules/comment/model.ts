import { CommentStatusSchema, createPaginatedListSchema, DateTimeSchema, intFromQuery } from '@nexus/shared/schema'
import { z } from 'zod'

export const CommentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  authorName: z.string(),
  authorEmail: z.string().nullable(),
  content: z.string(),
  status: CommentStatusSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
})

export type Comment = z.infer<typeof CommentSchema>

export const UpdateCommentStatusBodySchema = z.object({
  status: CommentStatusSchema.exclude(['deleted']),
})

export type UpdateCommentStatusBody = z.infer<typeof UpdateCommentStatusBodySchema>

export const CommentIdParamsSchema = z.object({
  id: z.string().min(1, '评论 ID 不能为空'),
})

export type CommentIdParams = z.infer<typeof CommentIdParamsSchema>

export const CommentListQuerySchema = z
  .object({
    page: intFromQuery('页码必须是整数').pipe(z.number().min(1, '页码必须大于 0').optional()),
    pageSize: intFromQuery('每页数量必须是整数').pipe(
      z.number().min(1, '每页数量必须大于 0').max(100, '每页数量不能超过 100').optional(),
    ),
    status: CommentStatusSchema.optional(),
    postId: z.string().min(1, '文章 ID 不能为空').optional(),
    keyword: z.string().optional(),
    createdFrom: DateTimeSchema.optional(),
    createdTo: DateTimeSchema.optional(),
  })
  .refine(
    (value) => {
      if (!value.createdFrom || !value.createdTo) {
        return true
      }

      return new Date(value.createdFrom).getTime() <= new Date(value.createdTo).getTime()
    },
    {
      message: '开始时间不能晚于结束时间',
      path: ['createdFrom'],
    },
  )

export type CommentListQuery = z.infer<typeof CommentListQuerySchema>

export const CommentListSchema = createPaginatedListSchema(CommentSchema)
export type CommentList = z.infer<typeof CommentListSchema>
