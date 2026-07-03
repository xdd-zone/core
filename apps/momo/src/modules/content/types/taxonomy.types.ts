import type { InferSelectModel } from 'drizzle-orm'
import type { contentCategories, contentPostDraftTags, contentTags } from '#momo/infra/db/schema/index'

export type ContentCategoryRecord = InferSelectModel<typeof contentCategories>
export type ContentTagRecord = InferSelectModel<typeof contentTags>
export type ContentPostTagRecord = InferSelectModel<typeof contentPostDraftTags>

export interface CreateCategoryInput {
  createdBy: string
  description?: string | null
  id: string
  name: string
  slug: string
}

export interface UpdateCategoryInput {
  description?: string | null
  id: string
  name?: string
  slug?: string
  updatedAt: Date
}

export interface CreateTagInput {
  createdBy: string
  id: string
  name: string
  slug: string
}

export interface UpdateTagInput {
  id: string
  name?: string
  slug?: string
  updatedAt: Date
}

export interface CategoryWithCount {
  category: ContentCategoryRecord
  postCount: number
}

export interface TagWithCount {
  postCount: number
  tag: ContentTagRecord
}
