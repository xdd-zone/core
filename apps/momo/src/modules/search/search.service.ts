import type { PublicSearchResponse, PublicSearchResult } from '@xdd-zone/contracts'
import type { MomoRuntime } from '#momo/bootstrap'

const SEARCH_INDEX_UID = 'site'

export function createSearchService(runtime: MomoRuntime) {
  async function search(query: string): Promise<PublicSearchResponse> {
    try {
      const response = await runtime.search.search<PublicSearchResult>(SEARCH_INDEX_UID, query, {
        limit: 20,
      })

      return {
        results: response.hits,
      }
    } catch {
      return {
        results: [],
      }
    }
  }

  async function indexPost(input: PublicSearchResult): Promise<void> {
    await runtime.search.addDocuments(SEARCH_INDEX_UID, [input], {
      primaryKey: 'id',
      waitForCompletion: false,
    })
  }

  return {
    indexPost,
    search,
  }
}
