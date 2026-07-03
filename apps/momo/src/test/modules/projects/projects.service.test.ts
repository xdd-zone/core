import type { OperationWarning } from '@xdd-zone/contracts'
import type { EventsService } from '#momo/modules/events/index'
import type { ProjectsRepository } from '#momo/modules/projects/projects.repository'
import { describe, expect, it, vi } from 'vitest'
import { createProjectsService } from '#momo/modules/projects/projects.service'

describe('projects service', () => {
  it('发布项目后调用项目发布事件处理', async () => {
    const repository = createRepository()
    const eventsService = createEventsService()
    const service = createProjectsService(repository, eventsService)

    const result = await service.publishProject('project-id', 'user-id')
    const eventId = vi.mocked(repository.publishProject).mock.calls[0]?.[2]

    expect(result.warnings).toBeUndefined()
    expect(eventId).toEqual(expect.any(String))
    expect(eventsService.handleProjectPublished).toHaveBeenCalledWith(eventId, {
      projectId: 'project-id',
      publishedAt: '2026-07-02T08:00:00.000Z',
      publishedSlug: 'momo-project',
      summary: '项目描述',
      title: 'Momo Project',
    })
  })

  it('发布项目时返回事件处理 warning', async () => {
    const warnings: OperationWarning[] = [
      {
        code: 'bobo.revalidate.failed',
        message: '项目已发布，但 Bobo 缓存刷新失败。稍后可以重试刷新。',
      },
    ]
    const service = createProjectsService(
      createRepository(),
      createEventsService({
        handleProjectPublished: vi.fn(async () => warnings),
      }),
    )

    const result = await service.publishProject('project-id', 'user-id')

    expect(result.warnings).toEqual(warnings)
  })

  it('生成项目预览 token 时写入 project 目标', async () => {
    const repository = createRepository({
      getProjectById: vi.fn(async () => createProjectRecord()),
    })
    const service = createProjectsService(repository, createEventsService())

    const result = await service.createPreviewToken('project-id', 'user-id')

    expect(result).toMatchObject({
      targetId: 'project-id',
      targetType: 'project',
    })
    expect(result.token).toEqual(expect.any(String))
    expect(repository.createPreviewToken).toHaveBeenCalledWith(
      expect.objectContaining({
        createdBy: 'user-id',
        targetId: 'project-id',
        tokenHash: expect.any(String),
      }),
    )
  })

  it('归档项目时调用归档事件处理', async () => {
    const repository = createRepository({
      archiveProject: vi.fn(async () => createProjectRecord({ status: 'archived' })),
    })
    const eventsService = createEventsService()
    const service = createProjectsService(repository, eventsService)

    const result = await service.archiveProject('project-id', 'user-id')

    expect(result.project.status).toBe('archived')
    expect(eventsService.handleProjectArchived).toHaveBeenCalledWith({
      eventId: expect.any(String),
      projectId: 'project-id',
      publishedSlug: 'momo-project',
    })
  })

  it('归档项目时返回事件处理 warning', async () => {
    const warnings: OperationWarning[] = [
      {
        code: 'project.archive.side_effect_failed',
        message: '项目已归档，但 Bobo 缓存刷新或搜索索引删除失败。稍后可以重试刷新。',
      },
    ]
    const service = createProjectsService(
      createRepository({
        archiveProject: vi.fn(async () => createProjectRecord({ status: 'archived' })),
      }),
      createEventsService({
        handleProjectArchived: vi.fn(async () => warnings),
      }),
    )

    const result = await service.archiveProject('project-id', 'user-id')

    expect(result.warnings).toEqual(warnings)
  })
})

function createRepository(overrides: Partial<ProjectsRepository> = {}): ProjectsRepository {
  return {
    archiveProject: vi.fn(),
    createProject: vi.fn(),
    createPreviewToken: vi.fn(),
    getProjectById: vi.fn(),
    getProjectByPublishedSlug: vi.fn(),
    listProjects: vi.fn(),
    listPublicProjects: vi.fn(),
    publishProject: vi.fn(async () => createProjectRecord()),
    saveDraft: vi.fn(),
    ...overrides,
  } as ProjectsRepository
}

function createEventsService(overrides: Partial<EventsService> = {}): EventsService {
  return {
    handleContentPostPublished: vi.fn(),
    handleContentPostArchived: vi.fn(),
    handleProjectArchived: vi.fn(async () => []),
    handleProjectPublished: vi.fn(async () => []),
    retryEvent: vi.fn(),
    retryPending: vi.fn(),
    ...overrides,
  } as EventsService
}

type ProjectRecord = NonNullable<Awaited<ReturnType<ProjectsRepository['getProjectById']>>>

function createProjectRecord(overrides: Partial<ProjectRecord> = {}): ProjectRecord {
  const now = new Date('2026-07-02T08:00:00.000Z')

  return {
    createdAt: now,
    createdBy: 'user-id',
    draftCoverAssetId: null,
    draftDescription: '项目描述',
    draftLinks: [],
    draftSlug: 'momo-project',
    draftTitle: 'Momo Project',
    id: 'project-id',
    order: 0,
    publishedAt: now,
    publishedBy: 'user-id',
    publishedCoverAssetId: null,
    publishedDescription: '项目描述',
    publishedLinks: [],
    publishedSlug: 'momo-project',
    publishedTitle: 'Momo Project',
    status: 'published',
    updatedAt: now,
    updatedBy: 'user-id',
    ...overrides,
  } satisfies ProjectRecord
}
