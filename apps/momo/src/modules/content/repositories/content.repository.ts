import type { SQL } from 'drizzle-orm'
import type { DbClient } from '#momo/infra/db/client'
import type {
  ArchiveContentPostInput,
  ContentAssetRecord,
  ContentPostRecord,
  ContentPreviewTokenRecord,
  ContentRevisionRecord,
  CreateContentPostInput,
  CreateContentPreviewTokenInput,
  ListPublicPostsInput,
  PublishContentPostInput,
  PublishContentPostResult,
  SaveContentDraftInput,
} from '../types/content.types'
import { and, desc, eq, inArray, ne, or, sql } from 'drizzle-orm'
import {
  contentAssets,
  contentCategories,
  contentPostRevisions,
  contentPosts,
  contentPostTags,
  contentPreviewTokens,
  contentTags,
  eventOutbox,
} from '#momo/infra/db/schema/index'

const CONTENT_POSTS_SLUG_UNIQUE = 'content_posts_slug_unique'
const CONTENT_POSTS_PUBLISHED_SLUG_UNIQUE = 'content_posts_published_slug_unique'
const CONTENT_POSTS_COVER_ASSET_ID_FK = 'content_posts_cover_asset_id_content_assets_id_fk'
const CONTENT_POST_REVISIONS_POST_REVISION_UNIQUE = 'content_post_revisions_post_revision_unique'
const FOREIGN_KEY_VIOLATION_CODE = '23503'
const UNIQUE_VIOLATION_CODE = '23505'
const SAVE_DRAFT_RETRY_TIMES = 2

export class ContentAssetNotFoundError extends Error {
  constructor() {
    super('content asset does not exist')
  }
}

export class ContentSlugConflictError extends Error {
  constructor() {
    super('content slug already exists')
  }
}

export function createContentRepository(db: DbClient) {
  async function createPost(input: CreateContentPostInput): Promise<ContentPostRecord | undefined> {
    const now = new Date()

    try {
      await db.transaction(async (tx) => {
        await tx.insert(contentPosts).values({
          categoryId: input.categoryId ?? null,
          coverAssetId: input.coverAssetId ?? null,
          createdAt: now,
          createdBy: input.userId,
          draftCoverAssetId: input.coverAssetId ?? null,
          draftExcerpt: input.excerpt ?? null,
          draftRevisionId: input.revisionId,
          draftSlug: input.slug,
          draftTitle: input.title,
          excerpt: input.excerpt ?? null,
          id: input.id,
          slug: input.slug,
          status: 'draft',
          title: input.title,
          updatedAt: now,
          updatedBy: input.userId,
        })

        await tx.insert(contentPostRevisions).values({
          createdAt: now,
          createdBy: input.userId,
          excerpt: input.excerpt ?? null,
          id: input.revisionId,
          postId: input.id,
          revisionNo: 1,
          source: input.source,
          title: input.title,
        })

        if (input.tagIds && input.tagIds.length > 0) {
          await tx.insert(contentPostTags).values(
            input.tagIds.map((tagId) => ({
              createdAt: now,
              postId: input.id,
              tagId,
            })),
          )
        }
      })
    } catch (error) {
      if (
        isUniqueConstraintError(error, CONTENT_POSTS_SLUG_UNIQUE) ||
        isUniqueConstraintError(error, CONTENT_POSTS_PUBLISHED_SLUG_UNIQUE)
      ) {
        throw new ContentSlugConflictError()
      }

      if (isForeignKeyConstraintError(error, CONTENT_POSTS_COVER_ASSET_ID_FK)) {
        throw new ContentAssetNotFoundError()
      }

      throw error
    }

    return getPostById(input.id)
  }

  async function getAssetById(id: string): Promise<ContentAssetRecord | undefined> {
    const [asset] = await db.select().from(contentAssets).where(eq(contentAssets.id, id)).limit(1)
    return asset
  }

  async function findPostBySlug(slug: string, excludePostId?: string): Promise<ContentPostRecord | undefined> {
    const conditions = [or(eq(contentPosts.draftSlug, slug), eq(contentPosts.publishedSlug, slug))!]

    if (excludePostId) {
      conditions.push(ne(contentPosts.id, excludePostId))
    }

    const [post] = await db
      .select()
      .from(contentPosts)
      .where(and(...conditions))
      .limit(1)
    return post
  }

  async function getPostById(id: string): Promise<ContentPostRecord | undefined> {
    const [post] = await db.select().from(contentPosts).where(eq(contentPosts.id, id)).limit(1)
    return post
  }

  async function getPostBySlug(slug: string): Promise<ContentPostRecord | undefined> {
    const [post] = await db.select().from(contentPosts).where(eq(contentPosts.publishedSlug, slug)).limit(1)
    return post
  }

  async function listPosts(): Promise<ContentPostRecord[]> {
    const posts = await db.select().from(contentPosts).orderBy(desc(contentPosts.updatedAt))
    return posts
  }

  async function listPublicPosts(input: ListPublicPostsInput = {}): Promise<ContentPostRecord[]> {
    const conditions: SQL<unknown>[] = [eq(contentPosts.status, 'published')]

    if (input.categorySlug) {
      const [category] = await db
        .select({ id: contentCategories.id })
        .from(contentCategories)
        .where(eq(contentCategories.slug, input.categorySlug))
        .limit(1)

      if (!category) {
        return []
      }

      conditions.push(eq(contentPosts.categoryId, category.id))
    }

    if (input.tagSlug) {
      const [tag] = await db
        .select({ id: contentTags.id })
        .from(contentTags)
        .where(eq(contentTags.slug, input.tagSlug))
        .limit(1)

      if (!tag) {
        return []
      }

      const postTagRows = await db
        .select({ postId: contentPostTags.postId })
        .from(contentPostTags)
        .where(eq(contentPostTags.tagId, tag.id))

      const postIds = postTagRows.map((row) => row.postId)
      if (postIds.length === 0) {
        return []
      }

      conditions.push(inArray(contentPosts.id, postIds))
    }

    const query = db
      .select()
      .from(contentPosts)
      .$dynamic()
      .where(and(...conditions))
      .orderBy(desc(contentPosts.publishedAt))

    if (input.limit !== undefined) {
      query.limit(input.limit)
    }

    if (input.offset !== undefined) {
      query.offset(input.offset)
    }

    return query
  }

  async function saveDraft(input: SaveContentDraftInput): Promise<ContentPostRecord | undefined> {
    for (let attempt = 1; attempt <= SAVE_DRAFT_RETRY_TIMES; attempt += 1) {
      try {
        return await saveDraftOnce(input)
      } catch (error) {
        if (
          isUniqueConstraintError(error, CONTENT_POSTS_SLUG_UNIQUE) ||
          isUniqueConstraintError(error, CONTENT_POSTS_PUBLISHED_SLUG_UNIQUE)
        ) {
          throw new ContentSlugConflictError()
        }

        if (isForeignKeyConstraintError(error, CONTENT_POSTS_COVER_ASSET_ID_FK)) {
          throw new ContentAssetNotFoundError()
        }

        if (
          isUniqueConstraintError(error, CONTENT_POST_REVISIONS_POST_REVISION_UNIQUE) &&
          attempt < SAVE_DRAFT_RETRY_TIMES
        ) {
          continue
        }

        throw error
      }
    }

    return undefined
  }

  async function saveDraftOnce(input: SaveContentDraftInput): Promise<ContentPostRecord | undefined> {
    return db.transaction(async (tx) => {
      const now = new Date()

      const [currentPost] = await tx.select().from(contentPosts).where(eq(contentPosts.id, input.id)).limit(1)

      if (!currentPost) {
        return undefined
      }

      const [lastRevision] = await tx
        .select({ revisionNo: contentPostRevisions.revisionNo })
        .from(contentPostRevisions)
        .where(eq(contentPostRevisions.postId, input.id))
        .orderBy(desc(contentPostRevisions.revisionNo))
        .limit(1)

      const revisionNo = (lastRevision?.revisionNo ?? 0) + 1
      const nextPost = {
        categoryId: input.categoryId === undefined ? currentPost.categoryId : input.categoryId,
        coverAssetId: input.coverAssetId === undefined ? currentPost.draftCoverAssetId : input.coverAssetId,
        excerpt: input.excerpt === undefined ? currentPost.draftExcerpt : input.excerpt,
        slug: input.slug ?? currentPost.draftSlug,
        source: input.source,
        title: input.title ?? currentPost.draftTitle,
      }

      await tx.insert(contentPostRevisions).values({
        createdAt: now,
        createdBy: input.userId,
        excerpt: nextPost.excerpt,
        id: input.revisionId,
        postId: input.id,
        revisionNo,
        source: nextPost.source,
        title: nextPost.title,
      })

      const [post] = await tx
        .update(contentPosts)
        .set({
          categoryId: nextPost.categoryId,
          coverAssetId: nextPost.coverAssetId,
          draftCoverAssetId: nextPost.coverAssetId,
          draftExcerpt: nextPost.excerpt,
          draftRevisionId: input.revisionId,
          draftSlug: nextPost.slug,
          draftTitle: nextPost.title,
          excerpt: nextPost.excerpt,
          slug: nextPost.slug,
          title: nextPost.title,
          updatedAt: now,
          updatedBy: input.userId,
        })
        .where(eq(contentPosts.id, input.id))
        .returning()

      if (input.tagIds !== undefined) {
        await tx.delete(contentPostTags).where(eq(contentPostTags.postId, input.id))

        if (input.tagIds.length > 0) {
          await tx.insert(contentPostTags).values(
            input.tagIds.map((tagId) => ({
              createdAt: now,
              postId: input.id,
              tagId,
            })),
          )
        }
      }

      return post
    })
  }

  async function getRevisionById(id: string): Promise<ContentRevisionRecord | undefined> {
    const [revision] = await db.select().from(contentPostRevisions).where(eq(contentPostRevisions.id, id)).limit(1)

    return revision
  }

  async function publishPost(input: PublishContentPostInput): Promise<PublishContentPostResult> {
    try {
      return await db.transaction(async (tx) => {
        const now = new Date()
        const [currentPost] = await tx.select().from(contentPosts).where(eq(contentPosts.id, input.postId)).limit(1)

        if (!currentPost) {
          return { status: 'not_found' }
        }

        if (!currentPost.draftRevisionId) {
          return { status: 'no_draft' }
        }

        const [revision] = await tx
          .select()
          .from(contentPostRevisions)
          .where(eq(contentPostRevisions.id, currentPost.draftRevisionId))
          .limit(1)

        if (!revision) {
          return { status: 'missing_draft_revision' }
        }

        const [post] = await tx
          .update(contentPosts)
          .set({
            publishedAt: now,
            publishedBy: input.userId,
            publishedCoverAssetId: currentPost.draftCoverAssetId,
            publishedExcerpt: currentPost.draftExcerpt,
            publishedRevisionId: revision.id,
            publishedSlug: currentPost.draftSlug,
            publishedTitle: currentPost.draftTitle,
            status: 'published',
            updatedAt: now,
            updatedBy: input.userId,
          })
          .where(eq(contentPosts.id, input.postId))
          .returning()

        if (!post) {
          return { status: 'not_found' }
        }

        await tx.insert(eventOutbox).values({
          createdAt: now,
          eventType: 'content.post.published',
          id: input.eventId,
          nextRunAt: now,
          payload: {
            postId: post.id,
            publishedAt: post.publishedAt?.toISOString() ?? null,
            publishedSlug: post.publishedSlug,
            summary: post.publishedExcerpt,
            title: post.publishedTitle,
          },
          status: 'pending',
          updatedAt: now,
        })

        return {
          eventId: input.eventId,
          post,
          revision,
          status: 'published',
        }
      })
    } catch (error) {
      if (isUniqueConstraintError(error, CONTENT_POSTS_PUBLISHED_SLUG_UNIQUE)) {
        throw new ContentSlugConflictError()
      }

      throw error
    }
  }

  async function archivePost(input: ArchiveContentPostInput): Promise<ContentPostRecord | undefined> {
    const [post] = await db
      .update(contentPosts)
      .set({
        status: 'archived',
        updatedAt: new Date(),
        updatedBy: input.userId,
      })
      .where(eq(contentPosts.id, input.postId))
      .returning()

    return post
  }

  async function createPreviewToken(input: CreateContentPreviewTokenInput): Promise<void> {
    await db.insert(contentPreviewTokens).values({
      createdAt: new Date(),
      createdBy: input.createdBy,
      expiresAt: input.expiresAt,
      id: input.id,
      postId: input.postId ?? null,
      revisionId: input.revisionId ?? null,
      targetId: input.targetId,
      targetType: input.targetType,
      tokenHash: input.tokenHash,
    })
  }

  async function getPreviewToken(tokenHash: string): Promise<ContentPreviewTokenRecord | undefined> {
    const [previewToken] = await db
      .select()
      .from(contentPreviewTokens)
      .where(eq(contentPreviewTokens.tokenHash, tokenHash))
      .limit(1)

    return previewToken
  }

  async function markPreviewTokenUsed(id: string) {
    await db.update(contentPreviewTokens).set({ usedAt: new Date() }).where(eq(contentPreviewTokens.id, id))
  }

  async function getCategoriesByPostIds(postIds: string[]): Promise<Map<string, string>> {
    if (postIds.length === 0) {
      return new Map()
    }

    const rows = await db
      .select({
        categoryId: contentPosts.categoryId,
        postId: contentPosts.id,
      })
      .from(contentPosts)
      .where(and(inArray(contentPosts.id, postIds), sql`${contentPosts.categoryId} IS NOT NULL`))

    const map = new Map<string, string>()
    for (const row of rows) {
      if (row.categoryId) {
        map.set(row.postId, row.categoryId)
      }
    }

    return map
  }

  return {
    createPost,
    createPreviewToken,
    archivePost,
    findPostBySlug,
    getAssetById,
    getCategoriesByPostIds,
    getPostById,
    getPostBySlug,
    getPreviewToken,
    getRevisionById,
    listPosts,
    listPublicPosts,
    markPreviewTokenUsed,
    publishPost,
    saveDraft,
  }
}

export type ContentRepository = ReturnType<typeof createContentRepository>

function isUniqueConstraintError(error: unknown, constraintName: string): boolean {
  return isConstraintError(error, UNIQUE_VIOLATION_CODE, constraintName)
}

function isForeignKeyConstraintError(error: unknown, constraintName: string): boolean {
  return isConstraintError(error, FOREIGN_KEY_VIOLATION_CODE, constraintName)
}

function isConstraintError(error: unknown, code: string, constraintName: string): boolean {
  if (error === null || typeof error !== 'object') {
    return false
  }

  const fields = error as { code?: unknown; constraint?: unknown; constraint_name?: unknown }

  return fields.code === code && (fields.constraint === constraintName || fields.constraint_name === constraintName)
}
