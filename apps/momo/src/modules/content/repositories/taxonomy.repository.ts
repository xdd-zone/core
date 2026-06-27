import type { DbClient } from '#momo/infra/db/client'
import type {
  CategoryWithCount,
  ContentCategoryRecord,
  ContentTagRecord,
  CreateCategoryInput,
  CreateTagInput,
  TagWithCount,
  UpdateCategoryInput,
  UpdateTagInput,
} from '../types/taxonomy.types'
import { and, eq, inArray, ne, sql } from 'drizzle-orm'
import { contentCategories, contentPosts, contentPostTags, contentTags } from '#momo/infra/db/schema/index'

const CONTENT_CATEGORIES_SLUG_UNIQUE = 'content_categories_slug_unique'
const CONTENT_TAGS_SLUG_UNIQUE = 'content_tags_slug_unique'
const UNIQUE_VIOLATION_CODE = '23505'

export class TaxonomySlugConflictError extends Error {
  constructor(public readonly type: 'category' | 'tag') {
    super(`${type} slug already exists`)
  }
}

export function createTaxonomyRepository(db: DbClient) {
  async function createCategory(input: CreateCategoryInput): Promise<ContentCategoryRecord> {
    const now = new Date()

    try {
      const [category] = await db
        .insert(contentCategories)
        .values({
          createdAt: now,
          createdBy: input.createdBy,
          description: input.description ?? null,
          id: input.id,
          name: input.name,
          slug: input.slug,
          updatedAt: now,
        })
        .returning()

      return category as ContentCategoryRecord
    } catch (error) {
      if (isUniqueConstraintError(error, CONTENT_CATEGORIES_SLUG_UNIQUE)) {
        throw new TaxonomySlugConflictError('category')
      }
      throw error
    }
  }

  async function getCategoryById(id: string): Promise<ContentCategoryRecord | undefined> {
    const [category] = await db.select().from(contentCategories).where(eq(contentCategories.id, id)).limit(1)
    return category
  }

  async function getCategoryBySlug(slug: string): Promise<ContentCategoryRecord | undefined> {
    const [category] = await db.select().from(contentCategories).where(eq(contentCategories.slug, slug)).limit(1)
    return category
  }

  async function findCategoryBySlug(slug: string, excludeId?: string): Promise<ContentCategoryRecord | undefined> {
    const conditions = [eq(contentCategories.slug, slug)]

    if (excludeId) {
      conditions.push(ne(contentCategories.id, excludeId))
    }

    const [category] = await db
      .select()
      .from(contentCategories)
      .where(and(...conditions))
      .limit(1)

    return category
  }

  async function listCategories(): Promise<ContentCategoryRecord[]> {
    return db.select().from(contentCategories).orderBy(contentCategories.name)
  }

  async function listCategoriesWithCount(): Promise<CategoryWithCount[]> {
    const rows = await db
      .select({
        category: contentCategories,
        postCount: sql<number>`count(${contentPosts.id})::int`.as('post_count'),
      })
      .from(contentCategories)
      .leftJoin(contentPosts, eq(contentCategories.id, contentPosts.categoryId))
      .groupBy(contentCategories.id)
      .orderBy(contentCategories.name)

    return rows.map((row) => ({
      category: row.category,
      postCount: row.postCount,
    }))
  }

  async function listCategoriesWithPublishedCount(): Promise<CategoryWithCount[]> {
    const rows = await db
      .select({
        category: contentCategories,
        postCount: sql<number>`count(${contentPosts.id})::int`.as('post_count'),
      })
      .from(contentCategories)
      .leftJoin(
        contentPosts,
        and(eq(contentCategories.id, contentPosts.categoryId), eq(contentPosts.status, 'published')),
      )
      .groupBy(contentCategories.id)
      .orderBy(contentCategories.name)

    return rows.map((row) => ({
      category: row.category,
      postCount: row.postCount,
    }))
  }

  async function updateCategory(input: UpdateCategoryInput): Promise<ContentCategoryRecord | undefined> {
    const updates: Partial<ContentCategoryRecord> = {
      updatedAt: input.updatedAt,
    }

    if (input.name !== undefined) {
      updates.name = input.name
    }

    if (input.slug !== undefined) {
      updates.slug = input.slug
    }

    if (input.description !== undefined) {
      updates.description = input.description
    }

    try {
      const [category] = await db
        .update(contentCategories)
        .set(updates)
        .where(eq(contentCategories.id, input.id))
        .returning()

      return category
    } catch (error) {
      if (isUniqueConstraintError(error, CONTENT_CATEGORIES_SLUG_UNIQUE)) {
        throw new TaxonomySlugConflictError('category')
      }
      throw error
    }
  }

  async function deleteCategory(id: string): Promise<ContentCategoryRecord | undefined> {
    const [category] = await db.delete(contentCategories).where(eq(contentCategories.id, id)).returning()
    return category
  }

  async function countPostsByCategory(categoryId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contentPosts)
      .where(eq(contentPosts.categoryId, categoryId))

    return result?.count ?? 0
  }

  async function createTag(input: CreateTagInput): Promise<ContentTagRecord> {
    const now = new Date()

    try {
      const [tag] = await db
        .insert(contentTags)
        .values({
          createdAt: now,
          createdBy: input.createdBy,
          id: input.id,
          name: input.name,
          slug: input.slug,
          updatedAt: now,
        })
        .returning()

      return tag as ContentTagRecord
    } catch (error) {
      if (isUniqueConstraintError(error, CONTENT_TAGS_SLUG_UNIQUE)) {
        throw new TaxonomySlugConflictError('tag')
      }
      throw error
    }
  }

  async function getTagById(id: string): Promise<ContentTagRecord | undefined> {
    const [tag] = await db.select().from(contentTags).where(eq(contentTags.id, id)).limit(1)
    return tag
  }

  async function getTagBySlug(slug: string): Promise<ContentTagRecord | undefined> {
    const [tag] = await db.select().from(contentTags).where(eq(contentTags.slug, slug)).limit(1)
    return tag
  }

  async function findTagBySlug(slug: string, excludeId?: string): Promise<ContentTagRecord | undefined> {
    const conditions = [eq(contentTags.slug, slug)]

    if (excludeId) {
      conditions.push(ne(contentTags.id, excludeId))
    }

    const [tag] = await db
      .select()
      .from(contentTags)
      .where(and(...conditions))
      .limit(1)

    return tag
  }

  async function listTags(): Promise<ContentTagRecord[]> {
    return db.select().from(contentTags).orderBy(contentTags.name)
  }

  async function listTagsWithCount(): Promise<TagWithCount[]> {
    const rows = await db
      .select({
        postCount: sql<number>`count(${contentPostTags.postId})::int`.as('post_count'),
        tag: contentTags,
      })
      .from(contentTags)
      .leftJoin(contentPostTags, eq(contentTags.id, contentPostTags.tagId))
      .groupBy(contentTags.id)
      .orderBy(contentTags.name)

    return rows.map((row) => ({
      postCount: row.postCount,
      tag: row.tag,
    }))
  }

  async function updateTag(input: UpdateTagInput): Promise<ContentTagRecord | undefined> {
    const updates: Partial<ContentTagRecord> = {
      updatedAt: input.updatedAt,
    }

    if (input.name !== undefined) {
      updates.name = input.name
    }

    if (input.slug !== undefined) {
      updates.slug = input.slug
    }

    try {
      const [tag] = await db.update(contentTags).set(updates).where(eq(contentTags.id, input.id)).returning()

      return tag
    } catch (error) {
      if (isUniqueConstraintError(error, CONTENT_TAGS_SLUG_UNIQUE)) {
        throw new TaxonomySlugConflictError('tag')
      }
      throw error
    }
  }

  async function deleteTag(id: string): Promise<ContentTagRecord | undefined> {
    const [tag] = await db.delete(contentTags).where(eq(contentTags.id, id)).returning()
    return tag
  }

  async function countPostsByTag(tagId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contentPostTags)
      .where(eq(contentPostTags.tagId, tagId))

    return result?.count ?? 0
  }

  async function setPostTags(postId: string, tagIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(contentPostTags).where(eq(contentPostTags.postId, postId))

      if (tagIds.length > 0) {
        const now = new Date()
        await tx.insert(contentPostTags).values(
          tagIds.map((tagId) => ({
            createdAt: now,
            postId,
            tagId,
          })),
        )
      }
    })
  }

  async function getPostTags(postId: string): Promise<ContentTagRecord[]> {
    const rows = await db
      .select({ tag: contentTags })
      .from(contentPostTags)
      .innerJoin(contentTags, eq(contentPostTags.tagId, contentTags.id))
      .where(eq(contentPostTags.postId, postId))
      .orderBy(contentTags.name)

    return rows.map((row) => row.tag)
  }

  async function getPostTagsByPostIds(postIds: string[]): Promise<Map<string, ContentTagRecord[]>> {
    if (postIds.length === 0) {
      return new Map()
    }

    const rows = await db
      .select({
        postId: contentPostTags.postId,
        tag: contentTags,
      })
      .from(contentPostTags)
      .innerJoin(contentTags, eq(contentPostTags.tagId, contentTags.id))
      .where(inArray(contentPostTags.postId, postIds))
      .orderBy(contentTags.name)

    const map = new Map<string, ContentTagRecord[]>()
    for (const row of rows) {
      const tags = map.get(row.postId) ?? []
      tags.push(row.tag)
      map.set(row.postId, tags)
    }

    return map
  }

  return {
    countPostsByCategory,
    countPostsByTag,
    createCategory,
    createTag,
    deleteCategory,
    deleteTag,
    findCategoryBySlug,
    findTagBySlug,
    getCategoryById,
    getCategoryBySlug,
    getPostTags,
    getPostTagsByPostIds,
    getTagById,
    getTagBySlug,
    listCategories,
    listCategoriesWithCount,
    listCategoriesWithPublishedCount,
    listTags,
    listTagsWithCount,
    setPostTags,
    updateCategory,
    updateTag,
  }
}

export type TaxonomyRepository = ReturnType<typeof createTaxonomyRepository>

function isUniqueConstraintError(error: unknown, constraintName: string): boolean {
  if (error === null || typeof error !== 'object') {
    return false
  }

  const fields = error as { code?: unknown; constraint?: unknown; constraint_name?: unknown }

  return (
    fields.code === UNIQUE_VIOLATION_CODE &&
    (fields.constraint === constraintName || fields.constraint_name === constraintName)
  )
}
