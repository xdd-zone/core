import type { SQL } from 'drizzle-orm'
import type { DbClient } from '#momo/infra/db/client'
import type { AssetRecord, AssetReferenceRecord, CreateAssetInput, UpdateAssetInput } from './types'
import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { contentAssets, contentPostRevisions, contentPosts } from '#momo/infra/db/schema/index'

export function createAssetsRepository(db: DbClient) {
  async function getAssetById(id: string): Promise<AssetRecord | undefined> {
    const [asset] = await db.select().from(contentAssets).where(eq(contentAssets.id, id)).limit(1)
    return asset
  }

  async function listAssets(options: {
    keyword?: string
    mimeType?: string
    offset: number
    limit: number
  }): Promise<AssetRecord[]> {
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

  async function createAsset(input: CreateAssetInput): Promise<AssetRecord> {
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
    return asset as AssetRecord
  }

  async function updateAsset(input: UpdateAssetInput): Promise<AssetRecord | undefined> {
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

  async function deleteAsset(id: string): Promise<AssetRecord | undefined> {
    const [asset] = await db.delete(contentAssets).where(eq(contentAssets.id, id)).returning()
    return asset
  }

  async function findAssetReferences(id: string, fileUrl?: string): Promise<AssetReferenceRecord[]> {
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

    const sourceUrls = [...new Set([asset.url, fileUrl].filter((url): url is string => Boolean(url)))]

    if (sourceUrls.length === 0) {
      return coverRefs
    }

    const sourceClause = sql.join(
      sourceUrls.map((url) => sql`${contentPostRevisions.source} ilike ${`%${url}%`}`),
      sql` or `,
    )

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

  return {
    countAssets,
    createAsset,
    deleteAsset,
    findAssetReferences,
    getAssetById,
    listAssets,
    updateAsset,
  }
}

function buildAssetWhereClause(options: { keyword?: string; mimeType?: string }): SQL<unknown> | undefined {
  const conditions: SQL<unknown>[] = []

  if (options.keyword) {
    const keyword = `%${options.keyword}%`
    conditions.push(sql`(${contentAssets.fileName} ilike ${keyword} or ${contentAssets.alt} ilike ${keyword})`)
  }

  if (options.mimeType) {
    conditions.push(ilike(contentAssets.mimeType, `${options.mimeType}%`))
  }

  return conditions.length > 0 ? and(...conditions) : undefined
}

export type AssetsRepository = ReturnType<typeof createAssetsRepository>
