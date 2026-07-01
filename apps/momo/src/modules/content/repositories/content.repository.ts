import type { SQL } from 'drizzle-orm'
import type { DbClient } from '#momo/infra/db/client'
import type {
  ContentAssetRecord,
  ContentAssetReferenceRecord,
  ContentPostRecord,
  ContentPreviewTokenRecord,
  ContentRevisionRecord,
  CreateContentAssetInput,
  CreateContentPostInput,
  CreateContentPreviewTokenInput,
  ListPublicPostsInput,
  PublishContentPostInput,
  PublishContentPostResult,
  SaveContentDraftInput,
  UpdateContentAssetInput,
} from '../types/content.types'
import { and, desc, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm'
import {
  contentAssets,
  contentCategories,
  contentPostRevisions,
  contentPosts,
  contentPostTags,
  contentPreviewTokens,
  contentTags,
} from '#momo/infra/db/schema/index'

const CONTENT_POSTS_SLUG_UNIQUE = 'content_posts_slug_unique'
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
          draftRevisionId: input.revisionId,
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
      if (isUniqueConstraintError(error, CONTENT_POSTS_SLUG_UNIQUE)) {
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
    const conditions = [eq(contentPosts.slug, slug)]

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
    const [post] = await db.select().from(contentPosts).where(eq(contentPosts.slug, slug)).limit(1)
    return post
  }

  async function listPosts(): Promise<ContentPostRecord[]> {
    const posts = await db.select().from(contentPosts).orderBy(desc(contentPosts.updatedAt))
    return posts
  }

  async function listAssets(options: {
    keyword?: string
    mimeType?: string
    offset: number
    limit: number
  }): Promise<ContentAssetRecord[]> {
    const whereClause = buildAssetWhereClause(options)
    const query = db
      .select()
      .from(contentAssets)
      .orderBy(desc(contentAssets.createdAt), desc(contentAssets.id))
      .limit(options.limit)
      .offset(options.offset)

    return whereClause ? query.where(whereClause) : query
  }

  async function countAssets(options: { keyword?: string; mimeType?: string }): Promise<number> {
    const whereClause = buildAssetWhereClause(options)
    const query = db.select({ count: sql<number>`count(*)::int` }).from(contentAssets)
    const [result] = whereClause ? await query.where(whereClause) : await query
    return result?.count ?? 0
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
        if (isUniqueConstraintError(error, CONTENT_POSTS_SLUG_UNIQUE)) {
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
        coverAssetId: input.coverAssetId === undefined ? currentPost.coverAssetId : input.coverAssetId,
        excerpt: input.excerpt === undefined ? currentPost.excerpt : input.excerpt,
        slug: input.slug ?? currentPost.slug,
        source: input.source,
        title: input.title ?? currentPost.title,
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
          draftRevisionId: input.revisionId,
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

  async function findAssetReferences(id: string): Promise<ContentAssetReferenceRecord[]> {
    const asset = await getAssetById(id)
    if (!asset) {
      return []
    }

    const coverRefs = await db
      .select({
        postId: contentPosts.id,
        postSlug: contentPosts.slug,
        postTitle: contentPosts.title,
        relation: sql<'cover'>`'cover'`.as('relation'),
      })
      .from(contentPosts)
      .where(eq(contentPosts.coverAssetId, id))

    if (!asset.url) {
      return coverRefs
    }

    const sourceClause = ilike(contentPostRevisions.source, `%${asset.url}%`)

    const draftRefs = await db
      .select({
        postId: contentPosts.id,
        postSlug: contentPosts.slug,
        postTitle: contentPosts.title,
        relation: sql<'draft-source'>`'draft-source'`.as('relation'),
      })
      .from(contentPosts)
      .innerJoin(contentPostRevisions, eq(contentPosts.draftRevisionId, contentPostRevisions.id))
      .where(and(eq(contentPosts.status, 'draft'), sourceClause))

    const publishedRefs = await db
      .select({
        postId: contentPosts.id,
        postSlug: contentPosts.slug,
        postTitle: contentPosts.title,
        relation: sql<'published-source'>`'published-source'`.as('relation'),
      })
      .from(contentPosts)
      .innerJoin(contentPostRevisions, eq(contentPosts.publishedRevisionId, contentPostRevisions.id))
      .where(and(eq(contentPosts.status, 'published'), sourceClause))

    return [...coverRefs, ...draftRefs, ...publishedRefs]
  }

  async function publishPost(input: PublishContentPostInput): Promise<PublishContentPostResult> {
    return db.transaction(async (tx) => {
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
          publishedRevisionId: revision.id,
          status: 'published',
          updatedAt: now,
          updatedBy: input.userId,
        })
        .where(eq(contentPosts.id, input.postId))
        .returning()

      if (!post) {
        return { status: 'not_found' }
      }

      return {
        post,
        revision,
        status: 'published',
      }
    })
  }

  async function createPreviewToken(input: CreateContentPreviewTokenInput): Promise<void> {
    await db.insert(contentPreviewTokens).values({
      createdAt: new Date(),
      createdBy: input.createdBy,
      expiresAt: input.expiresAt,
      id: input.id,
      postId: input.postId,
      revisionId: input.revisionId,
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

  async function createAsset(input: CreateContentAssetInput): Promise<ContentAssetRecord> {
    const now = new Date()
    await db.insert(contentAssets).values({
      alt: input.alt ?? null,
      createdAt: now,
      createdBy: input.createdBy,
      fileName: input.fileName,
      id: input.id,
      mimeType: input.mimeType,
      size: input.size,
      storagePath: input.storagePath,
      updatedAt: now,
      url: input.url ?? null,
    })

    const [asset] = await db.select().from(contentAssets).where(eq(contentAssets.id, input.id)).limit(1)
    return asset as ContentAssetRecord
  }

  async function updateAsset(input: UpdateContentAssetInput): Promise<ContentAssetRecord | undefined> {
    const [asset] = await db
      .update(contentAssets)
      .set({
        alt: input.alt,
        updatedAt: input.updatedAt,
      })
      .where(eq(contentAssets.id, input.id))
      .returning()

    return asset
  }

  async function deleteAsset(id: string): Promise<ContentAssetRecord | undefined> {
    const [asset] = await db.delete(contentAssets).where(eq(contentAssets.id, id)).returning()
    return asset
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
    countAssets,
    createAsset,
    createPost,
    createPreviewToken,
    deleteAsset,
    findAssetReferences,
    findPostBySlug,
    getAssetById,
    getCategoriesByPostIds,
    getPostById,
    getPostBySlug,
    getPreviewToken,
    getRevisionById,
    listAssets,
    listPosts,
    listPublicPosts,
    markPreviewTokenUsed,
    publishPost,
    saveDraft,
    updateAsset,
  }
}

export type ContentRepository = ReturnType<typeof createContentRepository>

function isUniqueConstraintError(error: unknown, constraintName: string): boolean {
  return isConstraintError(error, UNIQUE_VIOLATION_CODE, constraintName)
}

function isForeignKeyConstraintError(error: unknown, constraintName: string): boolean {
  return isConstraintError(error, FOREIGN_KEY_VIOLATION_CODE, constraintName)
}

function buildAssetWhereClause(options: { keyword?: string; mimeType?: string }): SQL<unknown> | undefined {
  const conditions: SQL<unknown>[] = []

  if (options.keyword) {
    const keyword = `%${options.keyword}%`
    conditions.push(
      or(
        ilike(contentAssets.fileName, keyword),
        ilike(contentAssets.storagePath, keyword),
        ilike(contentAssets.alt, keyword),
      )!,
    )
  }

  if (options.mimeType) {
    conditions.push(eq(contentAssets.mimeType, options.mimeType))
  }

  return conditions.length > 0 ? and(...conditions) : undefined
}

function isConstraintError(error: unknown, code: string, constraintName: string): boolean {
  if (error === null || typeof error !== 'object') {
    return false
  }

  const fields = error as { code?: unknown; constraint?: unknown; constraint_name?: unknown }

  return fields.code === code && (fields.constraint === constraintName || fields.constraint_name === constraintName)
}
