import type {
  SearchAddDocumentsOptions,
  SearchDriver,
  SearchHealthResult,
  SearchResponse,
  SearchTask,
  SearchWaitOptions,
} from './search.types'
import { BizCode } from '@xdd-zone/contracts'
import { AppError } from '#momo/shared/app-error'

function createDisabledSearchError(): AppError {
  return new AppError(BizCode.SYSTEM_INTERNAL_ERROR, '搜索服务未启用', 500)
}

export class DisabledSearch implements SearchDriver {
  async health(): Promise<SearchHealthResult> {
    return { status: 'disabled' }
  }

  async search<TDocument extends Record<string, unknown>>(
    _indexUid: string,
    _query: string,
    _options: Record<string, unknown> = {},
  ): Promise<SearchResponse<TDocument>> {
    throw createDisabledSearchError()
  }

  async addDocuments<TDocument extends Record<string, unknown>>(
    _indexUid: string,
    _documents: TDocument[],
    _options: SearchAddDocumentsOptions = {},
  ): Promise<SearchTask> {
    throw createDisabledSearchError()
  }

  async deleteDocument(
    _indexUid: string,
    _documentId: string | number,
    _options: SearchWaitOptions = {},
  ): Promise<SearchTask> {
    throw createDisabledSearchError()
  }

  async deleteDocuments(
    _indexUid: string,
    _documentIds: Array<string | number>,
    _options: SearchWaitOptions = {},
  ): Promise<SearchTask> {
    throw createDisabledSearchError()
  }

  async updateSettings(
    _indexUid: string,
    _settings: Record<string, unknown>,
    _options: SearchWaitOptions = {},
  ): Promise<SearchTask> {
    throw createDisabledSearchError()
  }

  async close(): Promise<void> {}
}
