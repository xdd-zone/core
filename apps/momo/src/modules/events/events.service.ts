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
  async function runEventTask(
    eventId: string,
    task: () => Promise<void>,
    warning: OperationWarning,
  ): Promise<OperationWarning[]> {
    try {
      await task()
      await repository.markDone(eventId)
      return []
    } catch (error) {
      const message = error instanceof Error ? error.message : warning.message
      await repository.markFailed(eventId, message)
      return [warning]
    }
  }

  async function handleContentPostPublished(
    eventId: string,
    payload: ContentPostPublishedPayload,
  ): Promise<OperationWarning[]> {
    return runEventTask(
      eventId,
      async () => {
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
          await runtime.search.addDocuments(
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
        }
      },
      {
        code: 'content.post.publish.side_effect_failed',
        message: '文章已发布，但 Bobo 缓存刷新或搜索索引写入失败。稍后可以重试刷新。',
      },
    )
  }

  async function handleProjectPublished(
    eventId: string,
    payload: ProjectPublishedPayload,
  ): Promise<OperationWarning[]> {
    return runEventTask(
      eventId,
      async () => {
        await runtime.boboRevalidate.revalidate({
          paths: payload.publishedSlug ? ['/', '/projects', `/projects/${payload.publishedSlug}`] : ['/', '/projects'],
          tags: ['projects:list', 'site:home', ...(payload.publishedSlug ? [`project:${payload.publishedSlug}`] : [])],
        })
        if (payload.publishedSlug && payload.title) {
          await runtime.search.addDocuments(
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
        }
      },
      {
        code: 'project.publish.side_effect_failed',
        message: '项目已发布，但 Bobo 缓存刷新或搜索索引写入失败。稍后可以重试刷新。',
      },
    )
  }

  async function handleContentPostArchived(payload: ContentPostArchivedPayload): Promise<OperationWarning[]> {
    return runEventTask(
      payload.eventId,
      async () => {
        await runtime.boboRevalidate.revalidate({
          paths: payload.publishedSlug ? ['/writing', `/writing/${payload.publishedSlug}`] : ['/writing'],
          tags: [
            'posts:list',
            'categories:list',
            'tags:list',
            ...(payload.publishedSlug ? [`post:${payload.publishedSlug}`] : []),
          ],
        })
        await runtime.search.deleteDocument('site', `post:${payload.postId}`, { waitForCompletion: false })
      },
      {
        code: 'content.post.archive.side_effect_failed',
        message: '文章已归档，但 Bobo 缓存刷新或搜索索引删除失败。稍后可以重试刷新。',
      },
    )
  }

  async function handleProjectArchived(payload: ProjectArchivedPayload): Promise<OperationWarning[]> {
    return runEventTask(
      payload.eventId,
      async () => {
        await runtime.boboRevalidate.revalidate({
          paths: payload.publishedSlug ? ['/', '/projects', `/projects/${payload.publishedSlug}`] : ['/', '/projects'],
          tags: ['projects:list', 'site:home', ...(payload.publishedSlug ? [`project:${payload.publishedSlug}`] : [])],
        })
        await runtime.search.deleteDocument('site', `project:${payload.projectId}`, { waitForCompletion: false })
      },
      {
        code: 'project.archive.side_effect_failed',
        message: '项目已归档，但 Bobo 缓存刷新或搜索索引删除失败。稍后可以重试刷新。',
      },
    )
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

    if (event.eventType === 'content.post.archived') {
      return handleContentPostArchived({
        ...(event.payload as unknown as Omit<ContentPostArchivedPayload, 'eventId'>),
        eventId: event.id,
      })
    }

    if (event.eventType === 'project.archived') {
      return handleProjectArchived({
        ...(event.payload as unknown as Omit<ProjectArchivedPayload, 'eventId'>),
        eventId: event.id,
      })
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
