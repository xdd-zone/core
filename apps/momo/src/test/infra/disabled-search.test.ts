import { describe, expect, it } from 'vitest'
import { DisabledSearch } from '#momo/infra/search'
import { AppError } from '#momo/shared/app-error'

describe('禁用搜索驱动', () => {
  it('health 返回 disabled', async () => {
    const search = new DisabledSearch()

    await expect(search.health()).resolves.toEqual({ status: 'disabled' })
  })

  it('数据方法会抛出搜索服务未启用', async () => {
    const search = new DisabledSearch()

    await expect(search.search('posts', 'momo')).rejects.toThrow('搜索服务未启用')
    await expect(search.addDocuments('posts', [{ id: 1 }])).rejects.toBeInstanceOf(AppError)
    await expect(search.deleteDocument('posts', 1)).rejects.toThrow('搜索服务未启用')
    await expect(search.deleteDocuments('posts', [1])).rejects.toThrow('搜索服务未启用')
    await expect(search.updateSettings('posts', { searchableAttributes: ['title'] })).rejects.toThrow('搜索服务未启用')
  })
})
