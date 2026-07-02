import type { CreateProjectRequest, SaveProjectDraftRequest } from '@xdd-zone/contracts'
import type { DbClient } from '#momo/infra/db/client'
import { desc, eq } from 'drizzle-orm'
import { contentPreviewTokens, eventOutbox, projects } from '#momo/infra/db/schema/index'

export function createProjectsRepository(db: DbClient) {
  async function listProjects() {
    return db.select().from(projects).orderBy(desc(projects.updatedAt))
  }

  async function listPublicProjects() {
    return db.select().from(projects).where(eq(projects.status, 'published')).orderBy(projects.order)
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
    const now = new Date()
    const [project] = await db
      .insert(projects)
      .values({
        createdAt: now,
        createdBy: userId,
        draftCoverAssetId: input.coverAssetId ?? null,
        draftDescription: input.description ?? null,
        draftLinks: input.links ?? [],
        draftSlug: input.slug,
        draftTitle: input.title,
        id,
        order: input.order ?? 0,
        updatedAt: now,
        updatedBy: userId,
      })
      .returning()

    return project
  }

  async function saveDraft(id: string, input: SaveProjectDraftRequest, userId: string) {
    const current = await getProjectById(id)
    if (!current) return undefined

    const [project] = await db
      .update(projects)
      .set({
        draftCoverAssetId: input.coverAssetId === undefined ? current.draftCoverAssetId : input.coverAssetId,
        draftDescription: input.description === undefined ? current.draftDescription : input.description,
        draftLinks: input.links ?? current.draftLinks,
        draftSlug: input.slug ?? current.draftSlug,
        draftTitle: input.title ?? current.draftTitle,
        order: input.order ?? current.order,
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

  async function archiveProject(id: string, userId: string) {
    const [project] = await db
      .update(projects)
      .set({
        status: 'archived',
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(projects.id, id))
      .returning()

    return project
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
      postId: null,
      revisionId: null,
      targetId: input.targetId,
      targetType: 'project',
      tokenHash: input.tokenHash,
    })
  }

  return {
    archiveProject,
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
