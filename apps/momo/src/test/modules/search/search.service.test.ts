import type { MomoRuntime } from '#momo/bootstrap'
import { describe, expect, it, vi } from 'vitest'
import { createSearchService } from '#momo/modules/search/search.service'

describe('search service', () => {
  it('搜索驱动报错时返回空结果', async () => {
    const runtime = createRuntime()
    const service = createSearchService(runtime)

    const result = await service.search('momo')

    expect(result).toEqual({ results: [] })
    expect(runtime.search.search).toHaveBeenCalledWith('site', 'momo', {
      limit: 20,
    })
  })
})

function createRuntime(): MomoRuntime {
  return {
    search: {
      search: vi.fn(async () => {
        throw new Error('search unavailable')
      }),
    },
  } as unknown as MomoRuntime
}
