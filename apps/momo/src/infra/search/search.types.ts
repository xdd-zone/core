export interface SearchHealthResult {
  status: string
}

export interface SearchTask {
  error?: unknown
  indexUid?: string
  status: string
  taskUid: number
  type?: string
}

export interface SearchWaitOptions {
  waitForCompletion?: boolean
}

export interface SearchAddDocumentsOptions extends SearchWaitOptions {
  primaryKey?: string
}

export interface SearchResponse<TDocument extends Record<string, unknown> = Record<string, unknown>> {
  estimatedTotalHits?: number
  hits: TDocument[]
  limit?: number
  offset?: number
  processingTimeMs?: number
  query?: string
  [key: string]: unknown
}

export interface SearchDriver {
  addDocuments: <TDocument extends Record<string, unknown>>(
    indexUid: string,
    documents: TDocument[],
    options?: SearchAddDocumentsOptions,
  ) => Promise<SearchTask>
  close: () => Promise<void>
  deleteDocument: (indexUid: string, documentId: string | number, options?: SearchWaitOptions) => Promise<SearchTask>
  deleteDocuments: (
    indexUid: string,
    documentIds: Array<string | number>,
    options?: SearchWaitOptions,
  ) => Promise<SearchTask>
  health: () => Promise<SearchHealthResult>
  search: <TDocument extends Record<string, unknown>>(
    indexUid: string,
    query: string,
    options?: Record<string, unknown>,
  ) => Promise<SearchResponse<TDocument>>
  updateSettings: (
    indexUid: string,
    settings: Record<string, unknown>,
    options?: SearchWaitOptions,
  ) => Promise<SearchTask>
}
