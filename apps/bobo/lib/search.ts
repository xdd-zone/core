import type { PublicSearchResult } from '@xdd-zone/contracts'
import { PublicSearchQuerySchema, PublicSearchResponseSchema } from '@xdd-zone/contracts'
import { searchPublicSite as requestPublicSearch } from '@/lib/api/search.api'
import { assertPublicCmsData, PublicCmsError } from '@/lib/public-cms-error'

export interface PublicSearchData {
  query: string
  results: PublicSearchResult[]
}

export async function searchPublicSite(query: string): Promise<PublicSearchData> {
  const parsedQuery = PublicSearchQuerySchema.safeParse({ q: query })

  if (!parsedQuery.success) {
    return {
      query: query.trim(),
      results: [],
    }
  }

  const body = await requestPublicSearch(parsedQuery.data.q)

  if (!body.ok) {
    throw new PublicCmsError('request-failed', body.error.message || 'Momo 搜索接口暂时不可用。', body.error.code)
  }

  return {
    query: parsedQuery.data.q,
    results: assertPublicCmsData(body.data, PublicSearchResponseSchema, 'Momo 返回的搜索结果格式不正确。').results,
  }
}
