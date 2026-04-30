import type { Prisma } from '@nexus/infra/database/prisma/generated/client'
import type { CATEGORY_BASE_SELECT } from './constants'

export type CategoryBaseData = Prisma.CategoryGetPayload<{
  select: typeof CATEGORY_BASE_SELECT
}>

export type CategoryWhereInput = Prisma.CategoryWhereInput

export type CategoryWithPublishedCount = CategoryBaseData & {
  publishedPostCount: number
}
