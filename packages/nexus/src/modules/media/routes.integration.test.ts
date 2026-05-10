import type {
  MediaStorageDriver,
  MediaStorageOpenFileOptions,
  MediaStorageSaveResult,
} from '@nexus/infra/storage/media-storage.types'

import type { Media, MediaList } from './model'

import { MediaStorage } from '@nexus/infra/storage/media-storage'
import { createIntegrationTestContext, createMediaFixture, expectDateTime, expectErrorResponse, expectNoBody } from '@nexus/test'

import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'

import { MediaPermissions } from './permissions'
import { MediaRepository } from './repository'

class TestMediaStorageDriver implements MediaStorageDriver {
  readonly removedPaths: string[] = []
  readonly savedFiles: File[] = []

  async save(file: File): Promise<MediaStorageSaveResult> {
    this.savedFiles.push(file)

    return {
      fileName: file.name,
      storagePath: `test/${file.name}`,
    }
  }

  async openFile(storagePath: string, options: MediaStorageOpenFileOptions): Promise<Response> {
    return new Response(`file:${storagePath}`, {
      status: 200,
      headers: {
        'content-disposition': `inline; filename="${encodeURIComponent(options.originalName)}"`,
        'content-length': String(options.size),
        'content-type': options.mimeType,
      },
    })
  }

  async remove(storagePath: string): Promise<void> {
    this.removedPaths.push(storagePath)
  }
}

const integration = createIntegrationTestContext({
  config: {
    auth: {
      methods: {
        emailPassword: {
          enabled: true,
          allowSignUp: true,
        },
      },
    },
  },
})

let storageDriver: TestMediaStorageDriver

const anonymousRunner = integration.anonymous
const createActor = integration.actor

async function requestJson<T>(
  path: string,
  init: RequestInit,
  runner = anonymousRunner,
): Promise<{ body: T; response: Response }> {
  return await integration.json<T>(path, init, runner)
}

function expectMediaContract(
  media: Media,
  expected: {
    id?: string
    fileName?: string
    originalName?: string
    mimeType?: string
    size?: number
    url?: string
    uploadedBy?: string | null
  } = {},
) {
  expect(typeof media.id).toBe('string')
  expect(media.id.length).toBeGreaterThan(0)
  expect(typeof media.fileName).toBe('string')
  expect(typeof media.originalName).toBe('string')
  expect(typeof media.mimeType).toBe('string')
  expect(typeof media.url).toBe('string')
  expect(typeof media.size).toBe('number')
  expect(media.size).toBeGreaterThanOrEqual(0)
  expectDateTime(media.createdAt)
  expectDateTime(media.updatedAt)

  if (expected.id !== undefined) {
    expect(media.id).toBe(expected.id)
  }
  if (expected.fileName !== undefined) {
    expect(media.fileName).toBe(expected.fileName)
  }
  if (expected.originalName !== undefined) {
    expect(media.originalName).toBe(expected.originalName)
  }
  if (expected.mimeType !== undefined) {
    expect(media.mimeType).toBe(expected.mimeType)
  }
  if (expected.size !== undefined) {
    expect(media.size).toBe(expected.size)
  }
  if (expected.url !== undefined) {
    expect(media.url).toBe(expected.url)
  }
  if (expected.uploadedBy !== undefined) {
    expect(media.uploadedBy).toBe(expected.uploadedBy)
  }
}

function expectMediaListContract(
  list: MediaList,
  expected: {
    page: number
    pageSize: number
    total?: number
    totalPages?: number
  },
) {
  expect(Array.isArray(list.items)).toBe(true)
  expect(list.page).toBe(expected.page)
  expect(list.pageSize).toBe(expected.pageSize)
  expect(list.total).toBeGreaterThanOrEqual(0)
  expect(list.totalPages).toBeGreaterThanOrEqual(0)

  if (expected.total !== undefined) {
    expect(list.total).toBe(expected.total)
  }
  if (expected.totalPages !== undefined) {
    expect(list.totalPages).toBe(expected.totalPages)
  }
}

beforeEach(() => {
  storageDriver = new TestMediaStorageDriver()
  MediaStorage.useDriver(storageDriver)
})

afterEach(async () => {
  spyOn(MediaRepository, 'create').mockRestore()
  MediaStorage.resetDriver()

  await integration.cleanup()
})

describe('media routes', () => {
  describe('upload', () => {
    it('可以上传图片，并返回媒体字段契约', async () => {
      const runner = await createActor([MediaPermissions.WRITE_ALL])
      const form = new FormData()
      form.set(
        'file',
        new File(['image-bytes'], 'avatar.png', {
          type: 'image/png',
        }),
      )

      const { response, body } = await requestJson<Media>(
        '/api/media/upload',
        {
          method: 'POST',
          body: form,
        },
        runner,
      )

      expect(response.status).toBe(200)
      integration.track.mediaId(body.id)
      expectMediaContract(body, {
        fileName: 'avatar.png',
        originalName: 'avatar.png',
        mimeType: 'image/png',
        size: 11,
        uploadedBy: runner.userId,
      })
      expect(new URL(body.url).pathname).toBe(`/api/media/${body.id}/file`)
      expect(storageDriver.savedFiles).toHaveLength(1)
      expect(storageDriver.savedFiles[0]?.name).toBe('avatar.png')
    })

    it('上传接口需要写入权限', async () => {
      const readRunner = await createActor([MediaPermissions.READ_ALL])
      const form = new FormData()
      form.set(
        'file',
        new File(['image-bytes'], 'avatar.png', {
          type: 'image/png',
        }),
      )

      const response = await readRunner('/api/media/upload', {
        method: 'POST',
        body: form,
      })

      await expectErrorResponse(response, { status: 403, message: '权限不足' })
    })

    it('上传非图片返回 400，并包含错误体关键字段', async () => {
      const runner = await createActor([MediaPermissions.WRITE_ALL])
      const form = new FormData()
      form.set(
        'file',
        new File(['text'], 'note.txt', {
          type: 'text/plain',
        }),
      )

      const response = await runner('/api/media/upload', {
        method: 'POST',
        body: form,
      })

      const body = await expectErrorResponse(response, {
        status: 400,
        errorCode: 'MEDIA_UNSUPPORTED_MIME_TYPE',
      })

      expect(body.message).toContain('不支持的文件类型')
      expect(storageDriver.savedFiles).toHaveLength(0)
      expect(storageDriver.removedPaths).toEqual([])
    })

    it('上传接口未登录和非法请求体应返回对应状态码', async () => {
      const form = new FormData()
      form.set(
        'file',
        new File(['image-bytes'], 'avatar.png', {
          type: 'image/png',
        }),
      )

      await expectErrorResponse(
        await anonymousRunner('/api/media/upload', {
          method: 'POST',
          body: form,
        }),
        { status: 401 },
      )

      const writeRunner = await createActor([MediaPermissions.WRITE_ALL])
      await expectErrorResponse(
        await writeRunner('/api/media/upload', {
          method: 'POST',
          body: new FormData(),
        }),
        { status: 422, errorCode: 'VALIDATION' },
      )
    })

    it('数据库写入失败时应回滚已保存文件，并返回 500 标准错误体', async () => {
      const runner = await createActor([MediaPermissions.WRITE_ALL])
      const createError = new Error('create failed')
      const createSpy = spyOn(MediaRepository, 'create').mockRejectedValue(createError)
      const form = new FormData()
      form.set(
        'file',
        new File(['image-bytes'], 'avatar.png', {
          type: 'image/png',
        }),
      )

      const response = await runner('/api/media/upload', {
        method: 'POST',
        body: form,
      })

      await expectErrorResponse(response, {
        status: 500,
        errorCode: 'INTERNAL_ERROR',
        message: '服务器内部错误',
      })
      expect(createSpy).toHaveBeenCalled()
      expect(storageDriver.savedFiles).toHaveLength(1)
      expect(storageDriver.removedPaths).toEqual(['test/avatar.png'])
    })
  })

  describe('list-detail', () => {
    it('后台列表和详情需要读取权限，并返回分页和媒体契约', async () => {
      const media = await createMediaFixture()
      integration.track.mediaId(media.id)

      await expectErrorResponse(await anonymousRunner('/api/media'), { status: 401 })

      const forbiddenRunner = await createActor([])
      await expectErrorResponse(await forbiddenRunner('/api/media'), { status: 403, message: '权限不足' })
      await expectErrorResponse(await forbiddenRunner(`/api/media/${media.id}`), {
        status: 403,
        message: '权限不足',
      })

      const readRunner = await createActor([MediaPermissions.READ_ALL])
      const listResult = await requestJson<MediaList>('/api/media?page=1&pageSize=20', {}, readRunner)

      expect(listResult.response.status).toBe(200)
      expectMediaListContract(listResult.body, {
        page: 1,
        pageSize: 20,
      })
      const listed = listResult.body.items.find((item) => item.id === media.id)
      expect(listed).toBeDefined()
      expectMediaContract(listed!, {
        id: media.id,
        fileName: media.fileName,
        originalName: media.originalName,
        mimeType: media.mimeType,
        size: media.size,
        url: media.url,
        uploadedBy: media.uploadedBy,
      })

      const detailResult = await requestJson<Media>(`/api/media/${media.id}`, {}, readRunner)
      expect(detailResult.response.status).toBe(200)
      expectMediaContract(detailResult.body, {
        id: media.id,
        fileName: media.fileName,
        originalName: media.originalName,
        mimeType: media.mimeType,
        size: media.size,
        url: media.url,
        uploadedBy: media.uploadedBy,
      })
    })

    it('列表无匹配资源时应返回空结果和分页元信息', async () => {
      const readRunner = await createActor([MediaPermissions.READ_ALL])
      const { response, body } = await requestJson<MediaList>('/api/media?page=999999&pageSize=5', {}, readRunner)

      expect(response.status).toBe(200)
      expectMediaListContract(body, {
        page: 999999,
        pageSize: 5,
      })
      expect(body.items).toHaveLength(0)
    })
  })

  describe('public file', () => {
    it('文件访问公开，并返回文件头契约', async () => {
      const media = await createMediaFixture({
        data: {
          fileName: 'avatar.png',
          originalName: 'avatar.png',
          mimeType: 'image/png',
          size: 9,
          storagePath: 'test/avatar.png',
        },
      })
      integration.track.mediaId(media.id)

      const response = await anonymousRunner(`/api/media/${media.id}/file`)

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('image/png')
      expect(response.headers.get('content-disposition')).toBe('inline; filename="avatar.png"')
      expect(response.headers.get('content-length')).toBe('9')
      expect(await response.text()).toBe('file:test/avatar.png')
    })
  })

  describe('error cases', () => {
    it('读取媒体失败时返回对应状态码', async () => {
      const readRunner = await createActor([MediaPermissions.READ_ALL])

      await expectErrorResponse(await readRunner('/api/media/missing-media-id'), {
        status: 404,
        message: '媒体不存在',
      })

      await expectErrorResponse(await readRunner('/api/media?page=0'), {
        status: 422,
        errorCode: 'VALIDATION',
      })
    })

    it('访问不存在媒体文件应返回 404', async () => {
      const response = await anonymousRunner('/api/media/missing-media-id/file')

      await expectErrorResponse(response, {
        status: 404,
        message: '媒体不存在',
      })
    })

    it('删除媒体返回 204 空 body，并触发存储删除', async () => {
      const media = await createMediaFixture({
        data: {
          storagePath: 'test/avatar.png',
        },
      })
      integration.track.mediaId(media.id)
      const runner = await createActor([MediaPermissions.WRITE_ALL])

      const response = await runner(`/api/media/${media.id}`, {
        method: 'DELETE',
      })

      await expectNoBody(response)
      expect(storageDriver.removedPaths).toEqual(['test/avatar.png'])
      integration.track.forget({ mediaId: media.id })
    })

    it('删除媒体失败时返回对应状态码', async () => {
      const media = await createMediaFixture()
      integration.track.mediaId(media.id)

      await expectErrorResponse(
        await anonymousRunner(`/api/media/${media.id}`, {
          method: 'DELETE',
        }),
        { status: 401 },
      )

      const readRunner = await createActor([MediaPermissions.READ_ALL])
      await expectErrorResponse(
        await readRunner(`/api/media/${media.id}`, {
          method: 'DELETE',
        }),
        { status: 403, message: '权限不足' },
      )

      const writeRunner = await createActor([MediaPermissions.WRITE_ALL])
      await expectErrorResponse(
        await writeRunner('/api/media/missing-media-id', {
          method: 'DELETE',
        }),
        { status: 404, message: '媒体不存在' },
      )
    })
  })
})
