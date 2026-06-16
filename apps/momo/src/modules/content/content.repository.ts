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
  PublishContentPostInput,
  PublishContentPostResult,
  SaveContentDraftInput,
} from './content.types'
import { contentAssets, contentPostRevisions, contentPosts, contentPreviewTokens } from '#momo/infra/db/schema/index'
import { and, desc, eq, ne } from 'drizzle-orm'

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
          coverAssetId: input.coverAssetId ?? null,
          createdAt: now,
          createdBy: input.userId,
          draftRevisionId: input.revisionId,
          excerpt: input.excerpt ?? null,
          format: input.format,
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
          format: input.format,
          id: input.revisionId,
          postId: input.id,
          revisionNo: 1,
          source: input.source,
          title: input.title,
        })
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

  async function getAssetById(id: string): Promise<ContentAssetReferenceRecord | undefined> {
    const [asset] = await db
      .select({ id: contentAssets.id })
      .from(contentAssets)
      .where(eq(contentAssets.id, id))
      .limit(1)
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

  async function listPublicPosts(): Promise<ContentPostRecord[]> {
    const posts = await db
      .select()
      .from(contentPosts)
      .where(eq(contentPosts.status, 'published'))
      .orderBy(desc(contentPosts.publishedAt))

    return posts
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
        coverAssetId: input.coverAssetId === undefined ? currentPost.coverAssetId : input.coverAssetId,
        excerpt: input.excerpt === undefined ? currentPost.excerpt : input.excerpt,
        format: input.format ?? currentPost.format,
        slug: input.slug ?? currentPost.slug,
        source: input.source,
        title: input.title ?? currentPost.title,
      }

      await tx.insert(contentPostRevisions).values({
        createdAt: now,
        createdBy: input.userId,
        excerpt: nextPost.excerpt,
        format: nextPost.format,
        id: input.revisionId,
        postId: input.id,
        revisionNo,
        source: nextPost.source,
        title: nextPost.title,
      })

      const [post] = await tx
        .update(contentPosts)
        .set({
          coverAssetId: nextPost.coverAssetId,
          draftRevisionId: input.revisionId,
          excerpt: nextPost.excerpt,
          format: nextPost.format,
          slug: nextPost.slug,
          title: nextPost.title,
          updatedAt: now,
          updatedBy: input.userId,
        })
        .where(eq(contentPosts.id, input.id))
        .returning()

      return post
    })
  }

  async function getRevisionById(id: string): Promise<ContentRevisionRecord | undefined> {
    const [revision] = await db.select().from(contentPostRevisions).where(eq(contentPostRevisions.id, id)).limit(1)

    return revision
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
    await db.insert(contentAssets).values({
      alt: input.alt,
      createdAt: new Date(),
      createdBy: input.createdBy,
      fileName: input.fileName,
      id: input.id,
      mimeType: input.mimeType,
      size: input.size,
      storagePath: input.storagePath,
      updatedAt: new Date(),
      url: input.url,
    })

    return input
  }

  return {
    createAsset,
    createPost,
    createPreviewToken,
    findPostBySlug,
    getAssetById,
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
