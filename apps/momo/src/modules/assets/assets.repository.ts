import type { SQL } from 'drizzle-orm'
import type { DbClient } from '#momo/infra/db/client'
import type { AssetRecord, AssetReferenceRecord, CreateAssetInput, UpdateAssetInput } from './types'
import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { assets, contentPostRevisions, contentPosts, projects } from '#momo/infra/db/schema/index'

export function createAssetsRepository(db: DbClient) {
  async function getAssetById(id: string): Promise<AssetRecord | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id)).limit(1)
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
      .from(assets)
      .orderBy(desc(assets.createdAt), desc(assets.id))
      .limit(options.limit)
      .offset(options.offset)

    return whereClause ? query.where(whereClause) : query
  }

  async function countAssets(options: { keyword?: string; mimeType?: string }): Promise<number> {
    const whereClause = buildAssetWhereClause(options)
    const query = db.select({ count: sql<number>`count(*)::int` }).from(assets)
    const [result] = whereClause ? await query.where(whereClause) : await query
    return result?.count ?? 0
  }

  async function createAsset(input: CreateAssetInput): Promise<AssetRecord> {
    const now = new Date()
    await db.insert(assets).values({
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

    const [asset] = await db.select().from(assets).where(eq(assets.id, input.id)).limit(1)
    return asset as AssetRecord
  }

  async function updateAsset(input: UpdateAssetInput): Promise<AssetRecord | undefined> {
    const [asset] = await db
      .update(assets)
      .set({
        alt: input.alt,
        updatedAt: input.updatedAt,
      })
      .where(eq(assets.id, input.id))
      .returning()

    return asset
  }

  async function deleteAsset(id: string): Promise<AssetRecord | undefined> {
    const [asset] = await db.delete(assets).where(eq(assets.id, id)).returning()
    return asset
  }

  async function findAssetReferences(id: string, fileUrl?: string): Promise<AssetReferenceRecord[]> {
    const asset = await getAssetById(id)
    if (!asset) {
      return []
    }

    const draftCoverRefs = await db
      .select({
        relation: sql<'draft-cover'>`'draft-cover'`.as('relation'),
        targetId: contentPosts.id,
        targetSlug: contentPosts.draftSlug,
        targetTitle: contentPosts.draftTitle,
        targetType: sql<'post'>`'post'`.as('target_type'),
      })
      .from(contentPosts)
      .where(eq(contentPosts.draftCoverAssetId, id))

    const publishedCoverRefs = await db
      .select({
        relation: sql<'published-cover'>`'published-cover'`.as('relation'),
        targetId: contentPosts.id,
        targetSlug: contentPosts.publishedSlug,
        targetTitle: contentPosts.publishedTitle,
        targetType: sql<'post'>`'post'`.as('target_type'),
      })
      .from(contentPosts)
      .where(and(eq(contentPosts.status, 'published'), eq(contentPosts.publishedCoverAssetId, id)))

    const projectDraftCoverRefs = await db
      .select({
        relation: sql<'draft-cover'>`'draft-cover'`.as('relation'),
        targetId: projects.id,
        targetSlug: projects.draftSlug,
        targetTitle: projects.draftTitle,
        targetType: sql<'project'>`'project'`.as('target_type'),
      })
      .from(projects)
      .where(eq(projects.draftCoverAssetId, id))

    const projectPublishedCoverRefs = await db
      .select({
        relation: sql<'published-cover'>`'published-cover'`.as('relation'),
        targetId: projects.id,
        targetSlug: projects.publishedSlug,
        targetTitle: projects.publishedTitle,
        targetType: sql<'project'>`'project'`.as('target_type'),
      })
      .from(projects)
      .where(and(eq(projects.status, 'published'), eq(projects.publishedCoverAssetId, id)))

    const coverRefs = [...draftCoverRefs, ...publishedCoverRefs, ...projectDraftCoverRefs, ...projectPublishedCoverRefs]
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
        relation: sql<'draft-source'>`'draft-source'`.as('relation'),
        targetId: contentPosts.id,
        targetSlug: contentPosts.draftSlug,
        targetTitle: contentPosts.draftTitle,
        targetType: sql<'post'>`'post'`.as('target_type'),
      })
      .from(contentPosts)
      .innerJoin(contentPostRevisions, eq(contentPosts.draftRevisionId, contentPostRevisions.id))
      .where(and(eq(contentPosts.status, 'draft'), sourceClause))

    const publishedRefs = await db
      .select({
        relation: sql<'published-source'>`'published-source'`.as('relation'),
        targetId: contentPosts.id,
        targetSlug: contentPosts.publishedSlug,
        targetTitle: contentPosts.publishedTitle,
        targetType: sql<'post'>`'post'`.as('target_type'),
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
    conditions.push(sql`(${assets.fileName} ilike ${keyword} or ${assets.alt} ilike ${keyword})`)
  }

  if (options.mimeType) {
    conditions.push(ilike(assets.mimeType, `${options.mimeType}%`))
  }

  return conditions.length > 0 ? and(...conditions) : undefined
}

export type AssetsRepository = ReturnType<typeof createAssetsRepository>
