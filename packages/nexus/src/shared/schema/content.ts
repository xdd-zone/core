import { z } from 'zod'

export const SlugSchema = z
  .string()
  .min(1, 'slug 不能为空')
  .max(120, 'slug 最多 120 个字符')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug 只允许小写字母、数字和短横线')
export type Slug = z.infer<typeof SlugSchema>

export const MarkdownSchema = z.string().min(1, 'Markdown 内容不能为空')
export type Markdown = z.infer<typeof MarkdownSchema>

export const ContentStatusSchema = z.enum(['draft', 'published'])
export type ContentStatus = z.infer<typeof ContentStatusSchema>

export const CommentStatusSchema = z.enum(['pending', 'approved', 'hidden', 'deleted'])
export type CommentStatus = z.infer<typeof CommentStatusSchema>
