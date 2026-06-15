import type { MomoLogger } from '#momo/infra/logger'
import type {
  SearchAddDocumentsOptions,
  SearchDriver,
  SearchHealthResult,
  SearchResponse,
  SearchTask,
  SearchWaitOptions,
} from './search.types'
import { AppError } from '#momo/shared/app-error'
import { BizCode } from '@xdd-zone/contracts'
import { Meilisearch } from 'meilisearch'

export interface MeilisearchSearchConfig {
  apiKey: string
  host: string
  indexPrefix: string
}

export interface MeilisearchTask {
  error?: unknown
  indexUid?: string
  status: string
  taskUid: number
  type?: string
}

export interface MeilisearchIndex {
  addDocuments: <TDocument extends Record<string, unknown>>(
    documents: TDocument[],
    options?: { primaryKey?: string },
  ) => Promise<MeilisearchTask>
  deleteDocument: (documentId: string | number) => Promise<MeilisearchTask>
  deleteDocuments: (documentIds: Array<string | number>) => Promise<MeilisearchTask>
  search: <TDocument extends Record<string, unknown>>(
    query: string,
    options?: Record<string, unknown>,
  ) => Promise<SearchResponse<TDocument>>
  updateSettings: (settings: Record<string, unknown>) => Promise<MeilisearchTask>
}

export interface MeilisearchClient {
  health: () => Promise<SearchHealthResult>
  index: (indexUid: string) => MeilisearchIndex
  waitForTask: (taskUid: number) => Promise<MeilisearchTask>
}

function createSearchError(): AppError {
  return new AppError(BizCode.SYSTEM_INTERNAL_ERROR, '搜索服务访问失败', 500)
}

function isFailedTask(task: MeilisearchTask): boolean {
  return task.status === 'failed' || task.status === 'canceled'
}

export class MeilisearchSearch implements SearchDriver {
  private readonly client: MeilisearchClient

  constructor(
    private readonly config: MeilisearchSearchConfig,
    client?: MeilisearchClient,
    private readonly logger?: MomoLogger,
  ) {
    this.client =
      client ??
      (new Meilisearch({
        apiKey: config.apiKey,
        host: config.host,
      }) as unknown as MeilisearchClient)
  }

  async health(): Promise<SearchHealthResult> {
    return this.run('health', () => this.client.health())
  }

  async search<TDocument extends Record<string, unknown>>(
    indexUid: string,
    query: string,
    options: Record<string, unknown> = {},
  ): Promise<SearchResponse<TDocument>> {
    return this.run('search', () => this.client.index(this.resolveIndexUid(indexUid)).search<TDocument>(query, options))
  }

  async addDocuments<TDocument extends Record<string, unknown>>(
    indexUid: string,
    documents: TDocument[],
    options: SearchAddDocumentsOptions = {},
  ): Promise<SearchTask> {
    return this.run('addDocuments', async () => {
      const task = await this.client.index(this.resolveIndexUid(indexUid)).addDocuments(documents, {
        primaryKey: options.primaryKey,
      })

      return this.resolveTask(task, options)
    })
  }

  async deleteDocument(
    indexUid: string,
    documentId: string | number,
    options: SearchWaitOptions = {},
  ): Promise<SearchTask> {
    return this.run('deleteDocument', async () => {
      const task = await this.client.index(this.resolveIndexUid(indexUid)).deleteDocument(documentId)
      return this.resolveTask(task, options)
    })
  }

  async deleteDocuments(
    indexUid: string,
    documentIds: Array<string | number>,
    options: SearchWaitOptions = {},
  ): Promise<SearchTask> {
    return this.run('deleteDocuments', async () => {
      const task = await this.client.index(this.resolveIndexUid(indexUid)).deleteDocuments(documentIds)
      return this.resolveTask(task, options)
    })
  }

  async updateSettings(
    indexUid: string,
    settings: Record<string, unknown>,
    options: SearchWaitOptions = {},
  ): Promise<SearchTask> {
    return this.run('updateSettings', async () => {
      const task = await this.client.index(this.resolveIndexUid(indexUid)).updateSettings(settings)
      return this.resolveTask(task, options)
    })
  }

  async close(): Promise<void> {}

  private resolveIndexUid(indexUid: string): string {
    return `${this.config.indexPrefix}_${indexUid}`
  }

  private async resolveTask(task: MeilisearchTask, options: SearchWaitOptions): Promise<SearchTask> {
    if (!options.waitForCompletion) {
      return task
    }

    const finishedTask = await this.client.waitForTask(task.taskUid)

    if (isFailedTask(finishedTask)) {
      throw createSearchError()
    }

    return finishedTask
  }

  private async run<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      this.logger?.error(
        {
          event: 'search.meilisearch.error',
          errorMessage: error instanceof Error ? error.message : undefined,
          operation,
        },
        'Meilisearch 搜索服务访问失败',
      )
      throw createSearchError()
    }
  }
}
