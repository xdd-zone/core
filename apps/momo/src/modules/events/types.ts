import type { InferSelectModel } from 'drizzle-orm'
import type { eventOutbox } from '#momo/infra/db/schema/index'

export type EventOutboxRecord = InferSelectModel<typeof eventOutbox>

export interface ContentPostPublishedPayload {
  postId: string
  publishedAt?: string | null
  publishedSlug: string | null
  summary?: string | null
  title?: string | null
}

export interface ContentPostArchivedPayload {
  eventId: string
  postId: string
  publishedSlug: string | null
}

export interface ProjectPublishedPayload {
  projectId: string
  publishedAt?: string | null
  publishedSlug: string | null
  summary?: string | null
  title?: string | null
}

export interface ProjectArchivedPayload {
  eventId: string
  projectId: string
  publishedSlug: string | null
}
