import type {
  MediaStorageDriver,
  MediaStorageOpenFileOptions,
  MediaStorageSaveResult,
} from '@nexus/infra/storage/media-storage.types'

import type { Media, MediaList } from './model'

import { MediaStorage } from '@nexus/infra/storage/media-storage'
import { createIntegrationTestContext, createMediaFixture, expectErrorResponse, expectNoBody } from '@nexus/test'

import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

import { MediaPermissions } from './permissions'

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

beforeEach(() => {
  storageDriver = new TestMediaStorageDriver()
  MediaStorage.useDriver(storageDriver)
})

afterEach(async () => {
  MediaStorage.resetDriver()

  await integration.cleanup()
})

describe('media routes', () => {
  it('可以上传图片', async () => {
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
    expect(body.originalName).toBe('avatar.png')
    expect(body.mimeType).toBe('image/png')
    expect(new URL(body.url).pathname).toBe(`/api/media/${body.id}/file`)
    expect(storageDriver.savedFiles).toHaveLength(1)
    integration.track.mediaId(body.id)
  })

  it('上传非图片返回 400', async () => {
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
  })

  it('后台列表和详情需要读取权限', async () => {
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
    const { response, body } = await requestJson<MediaList>('/api/media?page=1&pageSize=20', {}, readRunner)

    expect(response.status).toBe(200)
    expect(body.items.some((item) => item.id === media.id)).toBe(true)

    const detailResult = await requestJson<Media>(`/api/media/${media.id}`, {}, readRunner)
    expect(detailResult.response.status).toBe(200)
    expect(detailResult.body.id).toBe(media.id)
    expect(detailResult.body.url).toBe(media.url)
  })

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

  it('文件访问公开', async () => {
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
    expect(await response.text()).toBe('file:test/avatar.png')
  })

  it('访问不存在媒体文件应返回 404', async () => {
    const response = await anonymousRunner('/api/media/missing-media-id/file')

    await expectErrorResponse(response, {
      status: 404,
      message: '媒体不存在',
    })
  })

  it('删除媒体返回 204 空 body', async () => {
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
})
