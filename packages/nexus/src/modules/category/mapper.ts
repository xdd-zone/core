import type { Category } from './model'
import type { CategoryBaseData, CategoryWithPublishedCount } from './types'
import { serializeDateTime } from '@nexus/shared/schema'
import { CategoryRepository } from './repository'

export function serializeCategory(category: CategoryWithPublishedCount): Category {
  const { _count, ...data } = category

  return {
    ...data,
    postCount: _count.posts,
    publishedPostCount: category.publishedPostCount,
    createdAt: serializeDateTime(category.createdAt),
    updatedAt: serializeDateTime(category.updatedAt),
  }
}

export async function withPublishedPostCount<T extends CategoryBaseData>(
  items: T[],
): Promise<CategoryWithPublishedCount[]> {
  const publishedCountMap = await CategoryRepository.countPublishedPosts(items.map((item) => item.id))

  return items.map((item) => ({
    ...item,
    publishedPostCount: publishedCountMap.get(item.id) ?? 0,
  }))
}
