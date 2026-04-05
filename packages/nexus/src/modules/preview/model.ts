import { MarkdownSchema } from '@nexus/shared/schema'
import { z } from 'zod'

const PreviewExcerptSchema = z.string().trim().max(300, '摘要最多 300 个字符')
const PreviewCoverImageSchema = z.string().trim().url('请输入有效的封面 URL')

export const PreviewTypeSchema = z.enum(['post', 'page'])
export type PreviewType = z.infer<typeof PreviewTypeSchema>

export const PreviewMarkdownBodySchema = z.object({
  type: PreviewTypeSchema.optional(),
  markdown: MarkdownSchema.trim().min(1, 'Markdown 内容不能为空'),
  title: z.string().trim().max(200, '标题最多 200 个字符').optional(),
  excerpt: PreviewExcerptSchema.optional(),
  coverImage: PreviewCoverImageSchema.nullable().optional(),
})

export type PreviewMarkdownBody = z.infer<typeof PreviewMarkdownBodySchema>

export const PreviewHeadingSchema = z.object({
  level: z.number().int().min(1).max(6),
  text: z.string(),
  slug: z.string(),
})

export type PreviewHeading = z.infer<typeof PreviewHeadingSchema>

export const PreviewMarkdownResponseSchema = z.object({
  html: z.string(),
  toc: z.array(PreviewHeadingSchema),
  excerpt: z.string().nullable(),
})

export type PreviewMarkdownResponse = z.infer<typeof PreviewMarkdownResponseSchema>
