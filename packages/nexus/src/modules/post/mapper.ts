import type { ContentStatus } from '@nexus-prisma/generated/client'
import type { Post } from './model'
import type { PostBaseData } from './types'
import { serializeDateTime } from '@nexus/shared/schema'

export function toDatabasePostStatus(status: 'draft' | 'published'): ContentStatus {
  return status === 'published' ? 'PUBLISHED' : 'DRAFT'
}

export function toHttpPostStatus(status: ContentStatus): 'draft' | 'published' {
  return status === 'PUBLISHED' ? 'published' : 'draft'
}

export function serializePost(post: PostBaseData): Post {
  return {
    ...post,
    status: toHttpPostStatus(post.status),
    publishedAt: serializeDateTime(post.publishedAt),
    createdAt: serializeDateTime(post.createdAt),
    updatedAt: serializeDateTime(post.updatedAt),
  }
}
