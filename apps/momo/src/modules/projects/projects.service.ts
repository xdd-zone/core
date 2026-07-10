import type {
  CreateProjectRequest,
  OperationWarning,
  PreviewTokenResponse,
  ProjectSummary,
  PublicProjectListQuery,
  PublicProjectListResponse,
  PublicProjectSummary,
  SaveProjectDraftRequest,
} from '@xdd-zone/contracts'
import type { EventsService } from '#momo/modules/events/index'
import type { ProjectsRepository } from './projects.repository'
import { createHash, randomUUID } from 'node:crypto'
import {
  BizCode,
  PreviewTokenResponseSchema,
  ProjectSummarySchema,
  PublicProjectSummarySchema,
} from '@xdd-zone/contracts'
import { AppError } from '#momo/shared/app-error'

const PREVIEW_TOKEN_TTL_MS = 30 * 60 * 1000
const PUBLIC_PROJECT_LIST_DEFAULT_PAGE_SIZE = 8
const PUBLIC_PROJECT_LIST_MAX_PAGE_SIZE = 50

export function createProjectsService(repository: ProjectsRepository, eventsService?: EventsService) {
  async function listProjects(): Promise<ProjectSummary[]> {
    return (await repository.listProjects()).map(toProjectSummary)
  }

  async function listPublicProjects(query: PublicProjectListQuery): Promise<PublicProjectListResponse> {
    const page = normalizePage(query.page)
    const pageSize = normalizePageSize(query.pageSize)
    const offset = (page - 1) * pageSize
    const [projects, total] = await Promise.all([
      repository.listPublicProjects({ limit: pageSize, offset }),
      repository.countPublicProjects(),
    ])
    const totalPages = Math.ceil(total / pageSize)

    return {
      hasNextPage: page < totalPages,
      hasPreviousPage: totalPages > 0 && page > 1,
      page,
      pageSize,
      projects: projects.map(toPublicProjectSummary),
      total,
      totalPages,
    }
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

  async function publishProject(
    id: string,
    userId: string,
  ): Promise<{ project: ProjectSummary; warnings?: OperationWarning[] }> {
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

  async function archiveProject(
    id: string,
    userId: string,
  ): Promise<{ project: ProjectSummary; warnings?: OperationWarning[] }> {
    const eventId = randomUUID()
    const project = await repository.archiveProject(id, userId, eventId)
    if (!project) throw new AppError(BizCode.COMMON_NOT_FOUND, '项目不存在', 404)

    const warnings = eventsService?.handleProjectArchived
      ? await eventsService.handleProjectArchived({
          eventId,
          projectId: project.id,
          publishedSlug: project.publishedSlug,
        })
      : []

    return {
      project: toProjectSummary(project),
      warnings: warnings.length > 0 ? warnings : undefined,
    }
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
    draft: {
      coverAssetId: project.draftCoverAssetId,
      description: project.draftDescription,
      links: project.draftLinks,
      order: project.order,
      slug: project.draftSlug,
      title: project.draftTitle,
    },
    id: project.id,
    published: {
      coverAssetId: project.publishedCoverAssetId,
      description: project.publishedDescription,
      links: project.publishedLinks,
      publishedAt: project.publishedAt?.toISOString() ?? null,
      slug: project.publishedSlug,
      title: project.publishedTitle,
    },
    status: project.status,
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
    slug: project.publishedSlug!,
    title: project.publishedTitle!,
    updatedAt: project.updatedAt.toISOString(),
  })
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function normalizePage(value: number | undefined): number {
  if (!value || Number.isNaN(value)) {
    return 1
  }

  return Math.max(1, Math.floor(value))
}

function normalizePageSize(value: number | undefined): number {
  if (!value || Number.isNaN(value)) {
    return PUBLIC_PROJECT_LIST_DEFAULT_PAGE_SIZE
  }

  return Math.min(PUBLIC_PROJECT_LIST_MAX_PAGE_SIZE, Math.max(1, Math.floor(value)))
}

type ProjectRecord = NonNullable<Awaited<ReturnType<ProjectsRepository['getProjectById']>>>
