import type { CreateProjectRequest, SaveProjectDraftRequest } from '@xdd-zone/contracts'
import type { DbClient } from '#momo/infra/db/client'
import { desc, eq, sql } from 'drizzle-orm'
import { contentPreviewTokens, eventOutbox, projects } from '#momo/infra/db/schema/index'

export function createProjectsRepository(db: DbClient) {
  async function listProjects() {
    return db.select().from(projects).orderBy(desc(projects.updatedAt))
  }

  async function listPublicProjects(options: { limit: number; offset: number }) {
    return db
      .select()
      .from(projects)
      .where(eq(projects.status, 'published'))
      .orderBy(projects.order)
      .limit(options.limit)
      .offset(options.offset)
  }

  async function countPublicProjects(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(eq(projects.status, 'published'))
    return result?.count ?? 0
  }

  async function getProjectById(id: string) {
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
    return project!
  }

  async function getProjectByPublishedSlug(slug: string) {
    const [project] = await db.select().from(projects).where(eq(projects.publishedSlug, slug)).limit(1)
    return project
  }

  async function createProject(id: string, input: CreateProjectRequest, userId: string) {
    const draft = input.draft
    const now = new Date()
    const [project] = await db
      .insert(projects)
      .values({
        createdAt: now,
        createdBy: userId,
        draftCoverAssetId: draft.coverAssetId ?? null,
        draftDescription: draft.description ?? null,
        draftLinks: draft.links ?? [],
        draftSlug: draft.slug,
        draftTitle: draft.title,
        id,
        order: draft.order ?? 0,
        updatedAt: now,
        updatedBy: userId,
      })
      .returning()

    return project
  }

  async function saveDraft(id: string, input: SaveProjectDraftRequest, userId: string) {
    const current = await getProjectById(id)
    if (!current) return undefined
    const draft = input.draft

    const [project] = await db
      .update(projects)
      .set({
        draftCoverAssetId: draft.coverAssetId === undefined ? current.draftCoverAssetId : draft.coverAssetId,
        draftDescription: draft.description === undefined ? current.draftDescription : draft.description,
        draftLinks: draft.links ?? current.draftLinks,
        draftSlug: draft.slug ?? current.draftSlug,
        draftTitle: draft.title ?? current.draftTitle,
        order: draft.order ?? current.order,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(projects.id, id))
      .returning()

    return project
  }

  async function publishProject(id: string, userId: string, eventId: string) {
    const current = await getProjectById(id)
    if (!current) return undefined

    return db.transaction(async (tx) => {
      const now = new Date()
      const [project] = await tx
        .update(projects)
        .set({
          publishedAt: now,
          publishedBy: userId,
          publishedCoverAssetId: current.draftCoverAssetId,
          publishedDescription: current.draftDescription,
          publishedLinks: current.draftLinks,
          publishedSlug: current.draftSlug,
          publishedTitle: current.draftTitle,
          status: 'published',
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(projects.id, id))
        .returning()

      if (!project) {
        return undefined
      }

      await tx.insert(eventOutbox).values({
        createdAt: now,
        eventType: 'project.published',
        id: eventId,
        nextRunAt: now,
        payload: {
          projectId: project.id,
          publishedAt: project.publishedAt?.toISOString() ?? null,
          publishedSlug: project.publishedSlug,
          summary: project.publishedDescription,
          title: project.publishedTitle,
        },
        status: 'pending',
        updatedAt: now,
      })

      return project
    })
  }

  async function archiveProject(id: string, userId: string, eventId: string) {
    return db.transaction(async (tx) => {
      const now = new Date()
      const [project] = await tx
        .update(projects)
        .set({
          status: 'archived',
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(projects.id, id))
        .returning()

      if (!project) return undefined

      await tx.insert(eventOutbox).values({
        createdAt: now,
        eventType: 'project.archived',
        id: eventId,
        nextRunAt: now,
        payload: {
          projectId: project.id,
          publishedSlug: project.publishedSlug,
        },
        status: 'pending',
        updatedAt: now,
      })

      return project
    })
  }

  async function createPreviewToken(input: {
    createdBy: string
    expiresAt: Date
    id: string
    targetId: string
    tokenHash: string
  }): Promise<void> {
    await db.insert(contentPreviewTokens).values({
      createdAt: new Date(),
      createdBy: input.createdBy,
      expiresAt: input.expiresAt,
      id: input.id,
      targetId: input.targetId,
      targetType: 'project',
      tokenHash: input.tokenHash,
    })
  }

  return {
    archiveProject,
    countPublicProjects,
    createProject,
    createPreviewToken,
    getProjectById,
    getProjectByPublishedSlug,
    listProjects,
    listPublicProjects,
    publishProject,
    saveDraft,
  }
}

export type ProjectsRepository = ReturnType<typeof createProjectsRepository>
