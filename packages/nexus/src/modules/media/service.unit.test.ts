import type { MediaRecord } from './repository'

import { MediaStorage } from '@nexus/infra/storage/media-storage'
import { afterEach, describe, expect, it, spyOn } from 'bun:test'

import { MediaRepository } from './repository'
import { MediaService } from './service'

function createMediaRecord(override: Partial<MediaRecord> = {}): MediaRecord {
  return {
    id: 'media-1',
    fileName: 'avatar.png',
    originalName: 'avatar.png',
    mimeType: 'image/png',
    size: 12,
    storagePath: 'avatar.png',
    url: '/api/media/media-1/file',
    uploadedBy: 'user-1',
    createdAt: new Date('2026-04-05T00:00:00.000Z'),
    updatedAt: new Date('2026-04-05T00:00:00.000Z'),
    ...override,
  }
}

describe('MediaService.list', () => {
  afterEach(() => {
    spyOn(MediaRepository, 'paginate').mockRestore()
  })

  it('应返回序列化后的分页列表', async () => {
    const paginateSpy = spyOn(MediaRepository, 'paginate').mockResolvedValue({
      items: [createMediaRecord()],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    })

    const result = await MediaService.list({ page: 1, pageSize: 20 })

    expect(paginateSpy).toHaveBeenCalledWith({ page: 1, pageSize: 20 })
    expect(result.items[0]?.id).toBe('media-1')
    expect(result.items[0]?.mimeType).toBe('image/png')
  })
})

describe('MediaService.findById', () => {
  afterEach(() => {
    spyOn(MediaRepository, 'findById').mockRestore()
  })

  it('应返回媒体详情', async () => {
    const findSpy = spyOn(MediaRepository, 'findById').mockResolvedValue(createMediaRecord())

    const result = await MediaService.findById('media-1')

    expect(findSpy).toHaveBeenCalledWith('media-1')
    expect(result.id).toBe('media-1')
  })

  it('媒体不存在时应抛错', async () => {
    spyOn(MediaRepository, 'findById').mockResolvedValue(null)

    await expect(MediaService.findById('missing')).rejects.toThrow('媒体不存在')
  })
})

describe('MediaService.remove', () => {
  afterEach(() => {
    spyOn(MediaRepository, 'findById').mockRestore()
    spyOn(MediaRepository, 'delete').mockRestore()
    spyOn(MediaStorage, 'remove').mockRestore()
    spyOn(console, 'error').mockRestore()
  })

  it('应先删数据库记录再删本地文件', async () => {
    const calls: string[] = []

    spyOn(MediaRepository, 'findById').mockResolvedValue(createMediaRecord())
    spyOn(MediaStorage, 'remove').mockImplementation(async (storagePath) => {
      calls.push(`remove:${storagePath}`)
    })
    spyOn(MediaRepository, 'delete').mockImplementation(async (id) => {
      calls.push(`delete:${id}`)
      return createMediaRecord()
    })

    await MediaService.remove('media-1')

    expect(calls).toEqual(['delete:media-1', 'remove:avatar.png'])
  })

  it('本地文件删除失败时应保留数据库删除结果', async () => {
    spyOn(MediaRepository, 'findById').mockResolvedValue(createMediaRecord())

    const deleteSpy = spyOn(MediaRepository, 'delete').mockImplementation(async () => createMediaRecord())
    const storageRemoveError = new Error('remove failed')
    spyOn(MediaStorage, 'remove').mockRejectedValue(storageRemoveError)
    const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(MediaService.remove('media-1')).resolves.toBeUndefined()
    expect(deleteSpy).toHaveBeenCalledWith('media-1')
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('媒体不存在时应抛错且不删除文件', async () => {
    spyOn(MediaRepository, 'findById').mockResolvedValue(null)
    const deleteSpy = spyOn(MediaRepository, 'delete').mockResolvedValue(createMediaRecord())
    const removeSpy = spyOn(MediaStorage, 'remove').mockResolvedValue()

    await expect(MediaService.remove('missing')).rejects.toThrow('媒体不存在')
    expect(deleteSpy).not.toHaveBeenCalled()
    expect(removeSpy).not.toHaveBeenCalled()
  })
})

describe('MediaService.upload', () => {
  afterEach(() => {
    spyOn(MediaStorage, 'save').mockRestore()
    spyOn(MediaStorage, 'remove').mockRestore()
    spyOn(MediaRepository, 'create').mockRestore()
  })

  it('应拒绝非图片 MIME 类型', async () => {
    const file = new File(['hello'], 'note.txt', {
      type: 'text/plain',
    })
    const saveSpy = spyOn(MediaStorage, 'save').mockResolvedValue({
      fileName: 'note.txt',
      storagePath: 'note.txt',
    })
    const createSpy = spyOn(MediaRepository, 'create').mockResolvedValue(createMediaRecord())

    await expect(MediaService.upload('user-1', file)).rejects.toThrow('不支持的文件类型')
    expect(saveSpy).not.toHaveBeenCalled()
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('存储层返回公开 URL 时应写入媒体地址', async () => {
    const file = new File(['hello'], 'avatar.png', {
      type: 'image/png',
    })
    const createSpy = spyOn(MediaRepository, 'create').mockImplementation(async (data) => createMediaRecord(data))

    spyOn(MediaStorage, 'save').mockResolvedValue({
      fileName: 'avatar.png',
      publicUrl: 'https://cos.example/media/avatar.png',
      storagePath: 'media/avatar.png',
    })

    const result = await MediaService.upload('user-1', file)

    expect(result.url).toBe('https://cos.example/media/avatar.png')
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://cos.example/media/avatar.png',
      }),
    )
  })

  it('本地存储未返回公开 URL 时应写入绝对文件地址', async () => {
    const file = new File(['hello'], 'avatar.png', {
      type: 'image/png',
    })
    const createSpy = spyOn(MediaRepository, 'create').mockImplementation(async (data) => createMediaRecord(data))

    spyOn(MediaStorage, 'save').mockResolvedValue({
      fileName: 'avatar.png',
      storagePath: 'avatar.png',
    })

    const result = await MediaService.upload('user-1', file)

    expect(result.url).toMatch(/^http:\/\/localhost:7788\/api\/media\/[0-9a-f-]+\/file$/)
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: result.url,
      }),
    )
  })

  it('数据库写入失败时应回滚已保存文件', async () => {
    const file = new File(['hello'], 'avatar.png', {
      type: 'image/png',
    })
    const error = new Error('create failed')
    const removeSpy = spyOn(MediaStorage, 'remove').mockResolvedValue()

    spyOn(MediaStorage, 'save').mockResolvedValue({
      fileName: 'avatar.png',
      storagePath: 'avatar.png',
    })
    spyOn(MediaRepository, 'create').mockRejectedValue(error)

    await expect(MediaService.upload('user-1', file)).rejects.toBe(error)
    expect(removeSpy).toHaveBeenCalledWith('avatar.png')
  })
})

describe('MediaService.openFile', () => {
  afterEach(() => {
    spyOn(MediaRepository, 'findById').mockRestore()
    spyOn(MediaStorage, 'openFile').mockRestore()
  })

  it('应将打开文件请求交给存储层', async () => {
    const response = new Response(null, {
      status: 302,
      headers: {
        location: 'https://cos.example/media/avatar.png',
      },
    })
    const openFileSpy = spyOn(MediaStorage, 'openFile').mockResolvedValue(response)

    spyOn(MediaRepository, 'findById').mockResolvedValue(createMediaRecord())

    await expect(MediaService.openFile('media-1')).resolves.toBe(response)
    expect(openFileSpy).toHaveBeenCalledWith('avatar.png', {
      originalName: 'avatar.png',
      mimeType: 'image/png',
      size: 12,
    })
  })

  it('媒体不存在时不访问存储层', async () => {
    spyOn(MediaRepository, 'findById').mockResolvedValue(null)
    const openFileSpy = spyOn(MediaStorage, 'openFile').mockResolvedValue(new Response())

    await expect(MediaService.openFile('missing')).rejects.toThrow('媒体不存在')
    expect(openFileSpy).not.toHaveBeenCalled()
  })
})
