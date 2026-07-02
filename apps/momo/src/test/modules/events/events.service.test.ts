import type { MomoRuntime } from '#momo/bootstrap'
import type { EventsRepository } from '#momo/modules/events/events.repository'
import type { EventOutboxRecord } from '#momo/modules/events/types'
import { describe, expect, it, vi } from 'vitest'
import { createEventsService } from '#momo/modules/events/events.service'

describe('events service', () => {
  it('处理 content.post.published 时刷新 Bobo 并写入搜索索引', async () => {
    const event = createEventOutboxRecord({
      eventType: 'content.post.published',
      payload: {
        postId: 'post-id',
        publishedAt: '2026-07-02T08:00:00.000Z',
        publishedSlug: 'hello-momo',
        summary: '文章摘要',
        title: 'Hello Momo',
      },
    })
    const repository = createRepository({
      listPending: vi.fn(async () => [event]),
    })
    const runtime = createRuntime()
    const service = createEventsService(runtime, repository)

    const result = await service.retryPending()

    expect(result).toEqual({ handled: 1, warnings: [] })
    expect(runtime.boboRevalidate.revalidate).toHaveBeenCalledWith({
      paths: ['/writing', '/writing/hello-momo'],
      tags: ['posts:list', 'categories:list', 'tags:list', 'post:hello-momo'],
    })
    expect(runtime.search.addDocuments).toHaveBeenCalledWith(
      'site',
      [
        {
          id: 'post:post-id',
          publishedAt: '2026-07-02T08:00:00.000Z',
          summary: '文章摘要',
          title: 'Hello Momo',
          type: 'post',
          url: '/writing/hello-momo',
        },
      ],
      {
        primaryKey: 'id',
        waitForCompletion: false,
      },
    )
    expect(repository.markDone).toHaveBeenCalledWith('event-id')
  })

  it('处理文章归档时刷新 Bobo 并删除搜索索引', async () => {
    const runtime = createRuntime()
    const service = createEventsService(runtime, createRepository())

    await service.handleContentPostArchived({
      postId: 'post-id',
      publishedSlug: 'hello-momo',
    })

    expect(runtime.boboRevalidate.revalidate).toHaveBeenCalledWith({
      paths: ['/writing', '/writing/hello-momo'],
      tags: ['posts:list', 'categories:list', 'tags:list', 'post:hello-momo'],
    })
    expect(runtime.search.deleteDocument).toHaveBeenCalledWith('site', 'post:post-id', {
      waitForCompletion: false,
    })
  })
})

function createRepository(overrides: Partial<EventsRepository> = {}): EventsRepository {
  return {
    listPending: vi.fn(async () => []),
    markDone: vi.fn(),
    markFailed: vi.fn(),
    markPending: vi.fn(),
    ...overrides,
  } as EventsRepository
}

function createRuntime(): MomoRuntime {
  return {
    boboRevalidate: {
      revalidate: vi.fn(async () => undefined),
    },
    search: {
      addDocuments: vi.fn(async () => ({
        status: 'enqueued',
        taskUid: 1,
      })),
      deleteDocument: vi.fn(async () => ({
        status: 'enqueued',
        taskUid: 2,
      })),
    },
  } as unknown as MomoRuntime
}

function createEventOutboxRecord(overrides: Partial<EventOutboxRecord> = {}): EventOutboxRecord {
  const now = new Date('2026-07-02T08:00:00.000Z')

  return {
    attempts: 0,
    createdAt: now,
    errorMessage: null,
    eventType: 'content.post.published',
    id: 'event-id',
    lastRunAt: null,
    nextRunAt: now,
    payload: {},
    status: 'pending',
    updatedAt: now,
    ...overrides,
  } as EventOutboxRecord
}
