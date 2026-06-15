import type { MeilisearchClient, MeilisearchIndex, MeilisearchTask } from '#momo/infra/search'
import { MeilisearchSearch } from '#momo/infra/search'
import { AppError } from '#momo/shared/app-error'
import { beforeEach, describe, expect, it, vi } from 'vitest'

function createTask(overrides: Partial<MeilisearchTask> = {}): MeilisearchTask {
  return {
    status: 'enqueued',
    taskUid: 1,
    type: 'documentAdditionOrUpdate',
    ...overrides,
  }
}

function createIndex(): MeilisearchIndex {
  return {
    addDocuments: vi.fn().mockResolvedValue(createTask()),
    deleteDocument: vi.fn().mockResolvedValue(createTask({ type: 'documentDeletion' })),
    deleteDocuments: vi.fn().mockResolvedValue(createTask({ type: 'documentDeletion' })),
    search: vi.fn().mockResolvedValue({ hits: [{ id: 1, title: 'Momo' }], query: 'momo' }),
    updateSettings: vi.fn().mockResolvedValue(createTask({ type: 'settingsUpdate' })),
  }
}

function createClient(index: MeilisearchIndex): MeilisearchClient {
  return {
    health: vi.fn().mockResolvedValue({ status: 'available' }),
    index: vi.fn().mockReturnValue(index),
    waitForTask: vi.fn().mockResolvedValue(createTask({ status: 'succeeded' })),
  }
}

function createSearch(client: MeilisearchClient) {
  return new MeilisearchSearch(
    {
      apiKey: 'momo-meilisearch-development-master-key',
      host: 'http://localhost:57700',
      indexPrefix: 'momo',
    },
    client,
  )
}

describe('meilisearch 搜索驱动', () => {
  let client: MeilisearchClient
  let index: MeilisearchIndex

  beforeEach(() => {
    index = createIndex()
    client = createClient(index)
  })

  it('health 调用 Meilisearch client', async () => {
    const search = createSearch(client)

    await expect(search.health()).resolves.toEqual({ status: 'available' })
    expect(client.health).toHaveBeenCalledTimes(1)
  })

  it('search 使用带前缀的索引名', async () => {
    const search = createSearch(client)

    await expect(search.search('posts', 'momo', { limit: 10 })).resolves.toEqual({
      hits: [{ id: 1, title: 'Momo' }],
      query: 'momo',
    })

    expect(client.index).toHaveBeenCalledWith('momo_posts')
    expect(index.search).toHaveBeenCalledWith('momo', { limit: 10 })
  })

  it('addDocuments 返回 task', async () => {
    const search = createSearch(client)
    const documents = [{ id: 1, title: 'Momo' }]

    await expect(search.addDocuments('posts', documents, { primaryKey: 'id' })).resolves.toEqual(createTask())
    expect(client.index).toHaveBeenCalledWith('momo_posts')
    expect(index.addDocuments).toHaveBeenCalledWith(documents, { primaryKey: 'id' })
  })

  it('deleteDocument 返回 task', async () => {
    const search = createSearch(client)

    await expect(search.deleteDocument('posts', 1)).resolves.toEqual(createTask({ type: 'documentDeletion' }))
    expect(index.deleteDocument).toHaveBeenCalledWith(1)
  })

  it('deleteDocuments 返回 task', async () => {
    const search = createSearch(client)

    await expect(search.deleteDocuments('posts', [1, 2])).resolves.toEqual(createTask({ type: 'documentDeletion' }))
    expect(index.deleteDocuments).toHaveBeenCalledWith([1, 2])
  })

  it('updateSettings 返回 task', async () => {
    const search = createSearch(client)
    const settings = { searchableAttributes: ['title'] }

    await expect(search.updateSettings('posts', settings)).resolves.toEqual(createTask({ type: 'settingsUpdate' }))
    expect(index.updateSettings).toHaveBeenCalledWith(settings)
  })

  it('waitForCompletion 为 true 时等待 task 完成', async () => {
    const search = createSearch(client)

    await expect(search.addDocuments('posts', [{ id: 1 }], { waitForCompletion: true })).resolves.toEqual(
      createTask({ status: 'succeeded' }),
    )

    expect(client.waitForTask).toHaveBeenCalledWith(1)
  })

  it('等待 task 失败时抛搜索访问失败', async () => {
    vi.mocked(client.waitForTask).mockResolvedValue(
      createTask({ error: { message: 'bad settings' }, status: 'failed' }),
    )
    const search = createSearch(client)

    await expect(search.addDocuments('posts', [{ id: 1 }], { waitForCompletion: true })).rejects.toThrow(
      '搜索服务访问失败',
    )
  })

  it('sdk 抛错时转成 AppError', async () => {
    vi.mocked(index.search).mockRejectedValue(new Error('network failed'))
    const search = createSearch(client)

    await expect(search.search('posts', 'momo')).rejects.toBeInstanceOf(AppError)
    await expect(search.search('posts', 'momo')).rejects.toThrow('搜索服务访问失败')
  })
})
