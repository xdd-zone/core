import type { OperationWarning } from '@xdd-zone/contracts'
import type { MomoRuntime } from '#momo/bootstrap'
import type { EventsRepository } from './events.repository'
import type {
  ContentPostArchivedPayload,
  ContentPostPublishedPayload,
  EventOutboxRecord,
  ProjectArchivedPayload,
  ProjectPublishedPayload,
} from './types'

export function createEventsService(runtime: MomoRuntime, repository: EventsRepository) {
  async function handleContentPostPublished(
    eventId: string,
    payload: ContentPostPublishedPayload,
  ): Promise<OperationWarning[]> {
    try {
      await runtime.boboRevalidate.revalidate({
        paths: payload.publishedSlug ? ['/writing', `/writing/${payload.publishedSlug}`] : ['/writing'],
        tags: [
          'posts:list',
          'categories:list',
          'tags:list',
          ...(payload.publishedSlug ? [`post:${payload.publishedSlug}`] : []),
        ],
      })
      if (payload.publishedSlug && payload.title) {
        await runtime.search
          .addDocuments(
            'site',
            [
              {
                id: `post:${payload.postId}`,
                publishedAt: payload.publishedAt ?? null,
                summary: payload.summary ?? null,
                title: payload.title,
                type: 'post',
                url: `/writing/${payload.publishedSlug}`,
              },
            ],
            {
              primaryKey: 'id',
              waitForCompletion: false,
            },
          )
          .catch(() => undefined)
      }
      await repository.markDone(eventId)
      return []
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bobo 缓存刷新失败'
      await repository.markFailed(eventId, message)
      return [
        {
          code: 'bobo.revalidate.failed',
          message: '文章已发布，但 Bobo 缓存刷新失败。稍后可以重试刷新。',
        },
      ]
    }
  }

  async function handleProjectPublished(eventId: string, payload: ProjectPublishedPayload): Promise<OperationWarning[]> {
    try {
      await runtime.boboRevalidate.revalidate({
        paths: payload.publishedSlug ? ['/', '/projects', `/projects/${payload.publishedSlug}`] : ['/', '/projects'],
        tags: [
          'projects:list',
          'site:home',
          ...(payload.publishedSlug ? [`project:${payload.publishedSlug}`] : []),
        ],
      })
      if (payload.publishedSlug && payload.title) {
        await runtime.search
          .addDocuments(
            'site',
            [
              {
                id: `project:${payload.projectId}`,
                publishedAt: payload.publishedAt ?? null,
                summary: payload.summary ?? null,
                title: payload.title,
                type: 'project',
                url: `/projects/${payload.publishedSlug}`,
              },
            ],
            {
              primaryKey: 'id',
              waitForCompletion: false,
            },
          )
          .catch(() => undefined)
      }
      await repository.markDone(eventId)
      return []
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bobo 缓存刷新失败'
      await repository.markFailed(eventId, message)
      return [
        {
          code: 'bobo.revalidate.failed',
          message: '项目已发布，但 Bobo 缓存刷新失败。稍后可以重试刷新。',
        },
      ]
    }
  }

  async function handleContentPostArchived(payload: ContentPostArchivedPayload): Promise<void> {
    await Promise.all([
      runtime.boboRevalidate
        .revalidate({
          paths: payload.publishedSlug ? ['/writing', `/writing/${payload.publishedSlug}`] : ['/writing'],
          tags: [
            'posts:list',
            'categories:list',
            'tags:list',
            ...(payload.publishedSlug ? [`post:${payload.publishedSlug}`] : []),
          ],
        })
        .catch(() => undefined),
      runtime.search.deleteDocument('site', `post:${payload.postId}`, { waitForCompletion: false }).catch(() => undefined),
    ])
  }

  async function handleProjectArchived(payload: ProjectArchivedPayload): Promise<void> {
    await Promise.all([
      runtime.boboRevalidate
        .revalidate({
          paths: payload.publishedSlug ? ['/', '/projects', `/projects/${payload.publishedSlug}`] : ['/', '/projects'],
          tags: [
            'projects:list',
            'site:home',
            ...(payload.publishedSlug ? [`project:${payload.publishedSlug}`] : []),
          ],
        })
        .catch(() => undefined),
      runtime.search
        .deleteDocument('site', `project:${payload.projectId}`, { waitForCompletion: false })
        .catch(() => undefined),
    ])
  }

  async function retryPending(limit = 20): Promise<{ handled: number; warnings: OperationWarning[] }> {
    const events = await repository.listPending(limit)
    const warnings: OperationWarning[] = []

    for (const event of events) {
      const eventWarnings = await handleEvent(event)
      warnings.push(...eventWarnings)
    }

    return {
      handled: events.length,
      warnings,
    }
  }

  async function retryEvent(id: string): Promise<void> {
    await repository.markPending(id)
  }

  async function handleEvent(event: EventOutboxRecord): Promise<OperationWarning[]> {
    if (event.eventType === 'content.post.published') {
      return handleContentPostPublished(event.id, event.payload as unknown as ContentPostPublishedPayload)
    }

    if (event.eventType === 'project.published') {
      return handleProjectPublished(event.id, event.payload as unknown as ProjectPublishedPayload)
    }

    await repository.markDone(event.id)
    return []
  }

  return {
    handleContentPostArchived,
    handleContentPostPublished,
    handleProjectArchived,
    handleProjectPublished,
    retryEvent,
    retryPending,
  }
}

export type EventsService = ReturnType<typeof createEventsService>
