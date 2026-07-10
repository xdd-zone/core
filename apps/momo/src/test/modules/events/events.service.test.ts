import type { MomoRuntime } from '#momo/bootstrap'
import type { EventsRepository } from '#momo/modules/events/events.repository'
import type { EventOutboxRecord } from '#momo/modules/events/types'
import { describe, expect, it, vi } from 'vitest'
import { createEventsService } from '#momo/modules/events/events.service'

describe('events service', () => {
  it('分页返回 outbox 记录且列表不包含 payload', async () => {
    const event = createEventOutboxRecord({ payload: { secret: 'detail-only' } })
    const repository = createRepository({
      list: vi.fn(async () => ({ events: [event], total: 1 })),
    })
    const service = createEventsService(createRuntime(), repository)

    const result = await service.listOutboxEvents({ page: 1, pageSize: 20 })

    expect(result).toMatchObject({ page: 1, pageSize: 20, total: 1 })
    expect(result.events[0]).not.toHaveProperty('payload')
    expect(repository.list).toHaveBeenCalledWith({ page: 1, pageSize: 20 })
  })

  it('单条重试只处理指定记录', async () => {
    const pending = createEventOutboxRecord({ eventType: 'system.test', status: 'failed' })
    const done = createEventOutboxRecord({ eventType: 'system.test', status: 'done' })
    const repository = createRepository({
      findById: vi.fn().mockResolvedValueOnce(pending).mockResolvedValueOnce(done),
    })
    const service = createEventsService(createRuntime(), repository)

    const result = await service.retryEvent('event-id')

    expect(repository.markPending).toHaveBeenCalledWith('event-id')
    expect(repository.markDone).toHaveBeenCalledWith('event-id')
    expect(repository.listPending).not.toHaveBeenCalled()
    expect(result.event.status).toBe('done')
  })

  it('读取不存在的 outbox 记录时返回 404 错误', async () => {
    const service = createEventsService(createRuntime(), createRepository())

    await expect(service.getOutboxEvent('missing')).rejects.toMatchObject({
      message: '发布后任务不存在',
      status: 404,
    })
  })

  it('已完成的 outbox 记录不能重复重试', async () => {
    const repository = createRepository({
      findById: vi.fn(async () => createEventOutboxRecord({ status: 'done' })),
    })
    const service = createEventsService(createRuntime(), repository)

    await expect(service.retryEvent('event-id')).rejects.toMatchObject({
      message: '当前任务状态不能重试',
      status: 409,
    })
    expect(repository.markPending).not.toHaveBeenCalled()
  })

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
      eventId: 'event-id',
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
    findById: vi.fn(async () => undefined),
    list: vi.fn(async () => ({ events: [], total: 0 })),
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
