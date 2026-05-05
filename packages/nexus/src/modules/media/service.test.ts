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

    const deleteSpy = spyOn(MediaRepository, 'delete').mockImplementation(async () => {
      return createMediaRecord()
    })
    const storageRemoveError = new Error('remove failed')
    spyOn(MediaStorage, 'remove').mockRejectedValue(storageRemoveError)
    const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(MediaService.remove('media-1')).resolves.toBeUndefined()
    expect(deleteSpy).toHaveBeenCalledWith('media-1')
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})

describe('MediaService.upload', () => {
  afterEach(() => {
    spyOn(MediaStorage, 'save').mockRestore()
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
})
