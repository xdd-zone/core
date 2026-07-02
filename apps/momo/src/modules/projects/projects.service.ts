import type {
  CreateProjectRequest,
  OperationWarning,
  PreviewTokenResponse,
  ProjectSummary,
  PublicProjectSummary,
  SaveProjectDraftRequest,
} from '@xdd-zone/contracts'
import type { EventsService } from '#momo/modules/events/index'
import type { ProjectsRepository } from './projects.repository'
import { createHash, randomUUID } from 'node:crypto'
import { BizCode, PreviewTokenResponseSchema, ProjectSummarySchema, PublicProjectSummarySchema } from '@xdd-zone/contracts'
import { AppError } from '#momo/shared/app-error'

const PREVIEW_TOKEN_TTL_MS = 30 * 60 * 1000

export function createProjectsService(repository: ProjectsRepository, eventsService?: EventsService) {
  async function listProjects(): Promise<ProjectSummary[]> {
    return (await repository.listProjects()).map(toProjectSummary)
  }

  async function listPublicProjects(): Promise<PublicProjectSummary[]> {
    return (await repository.listPublicProjects()).map(toPublicProjectSummary)
  }

  async function getProject(id: string): Promise<ProjectSummary> {
    const project = await repository.getProjectById(id)
    if (!project) throw new AppError(BizCode.COMMON_NOT_FOUND, '项目不存在', 404)
    return toProjectSummary(project)
  }

  async function getPublicProject(slug: string): Promise<PublicProjectSummary> {
    const project = await repository.getProjectByPublishedSlug(slug)
    if (!project || project.status !== 'published') throw new AppError(BizCode.COMMON_NOT_FOUND, '项目不存在', 404)
    return toPublicProjectSummary(project)
  }

  async function createProject(input: CreateProjectRequest, userId: string): Promise<ProjectSummary> {
    return toProjectSummary(await repository.createProject(randomUUID(), input, userId))
  }

  async function saveDraft(id: string, input: SaveProjectDraftRequest, userId: string): Promise<ProjectSummary> {
    const project = await repository.saveDraft(id, input, userId)
    if (!project) throw new AppError(BizCode.COMMON_NOT_FOUND, '项目不存在', 404)
    return toProjectSummary(project)
  }

  async function publishProject(id: string, userId: string): Promise<{ project: ProjectSummary; warnings?: OperationWarning[] }> {
    const eventId = randomUUID()
    const project = await repository.publishProject(id, userId, eventId)
    if (!project) throw new AppError(BizCode.COMMON_NOT_FOUND, '项目不存在', 404)
    const warnings = eventsService?.handleProjectPublished
      ? await eventsService.handleProjectPublished(eventId, {
          projectId: project.id,
          publishedAt: project.publishedAt?.toISOString() ?? null,
          publishedSlug: project.publishedSlug,
          summary: project.publishedDescription,
          title: project.publishedTitle,
        })
      : []
    return {
      project: toProjectSummary(project),
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  async function archiveProject(id: string, userId: string): Promise<ProjectSummary> {
    const project = await repository.archiveProject(id, userId)
    if (!project) throw new AppError(BizCode.COMMON_NOT_FOUND, '项目不存在', 404)

    await eventsService?.handleProjectArchived({
      projectId: project.id,
      publishedSlug: project.publishedSlug,
    })

    return toProjectSummary(project)
  }

  async function createPreviewToken(id: string, userId: string): Promise<PreviewTokenResponse> {
    const project = await repository.getProjectById(id)
    if (!project) throw new AppError(BizCode.COMMON_NOT_FOUND, '项目不存在', 404)

    const token = randomUUID().replaceAll('-', '')
    const expiresAt = new Date(Date.now() + PREVIEW_TOKEN_TTL_MS)

    await repository.createPreviewToken({
      createdBy: userId,
      expiresAt,
      id: randomUUID(),
      targetId: id,
      tokenHash: hashToken(token),
    })

    return PreviewTokenResponseSchema.parse({
      expiresAt: expiresAt.toISOString(),
      postId: null,
      revisionId: null,
      targetId: id,
      targetType: 'project',
      token,
    })
  }

  return {
    archiveProject,
    createProject,
    createPreviewToken,
    getProject,
    getPublicProject,
    listProjects,
    listPublicProjects,
    publishProject,
    saveDraft,
  }
}

function toProjectSummary(project: ProjectRecord): ProjectSummary {
  return ProjectSummarySchema.parse({
    coverAssetId: project.draftCoverAssetId,
    description: project.draftDescription,
    id: project.id,
    links: project.draftLinks,
    order: project.order,
    publishedAt: project.publishedAt?.toISOString() ?? null,
    slug: project.draftSlug,
    status: project.status,
    title: project.draftTitle,
    updatedAt: project.updatedAt.toISOString(),
  })
}

function toPublicProjectSummary(project: ProjectRecord): PublicProjectSummary {
  return PublicProjectSummarySchema.parse({
    coverAssetId: project.publishedCoverAssetId,
    description: project.publishedDescription,
    id: project.id,
    links: project.publishedLinks,
    order: project.order,
    publishedAt: project.publishedAt?.toISOString() ?? null,
    slug: project.publishedSlug ?? project.draftSlug,
    title: project.publishedTitle ?? project.draftTitle,
    updatedAt: project.updatedAt.toISOString(),
  })
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

type ProjectRecord = NonNullable<Awaited<ReturnType<ProjectsRepository['getProjectById']>>>
