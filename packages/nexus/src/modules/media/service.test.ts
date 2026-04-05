import { MediaStorage } from '@nexus/infra/storage/media-storage'
import { afterEach, describe, expect, it, spyOn } from 'bun:test'

import { MediaRepository } from './repository'
import { MediaService } from './service'

function createMediaRecord() {
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
  }
}

describe('MediaService.remove', () => {
  afterEach(() => {
    spyOn(MediaRepository, 'findById').mockRestore()
    spyOn(MediaRepository, 'delete').mockRestore()
    spyOn(MediaStorage, 'remove').mockRestore()
  })

  it('应先删本地文件再删数据库记录', async () => {
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

    expect(calls).toEqual(['remove:avatar.png', 'delete:media-1'])
  })

  it('本地文件删除失败时应保留数据库记录', async () => {
    spyOn(MediaRepository, 'findById').mockResolvedValue(createMediaRecord())

    const deleteSpy = spyOn(MediaRepository, 'delete').mockImplementation(async () => {
      throw new Error('delete should not be called')
    })
    const storageRemoveError = new Error('remove failed')
    spyOn(MediaStorage, 'remove').mockRejectedValue(storageRemoveError)

    await expect(MediaService.remove('media-1')).rejects.toBe(storageRemoveError)
    expect(deleteSpy).not.toHaveBeenCalled()
  })
})
