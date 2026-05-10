import type { CosSdkClient } from './cos-media-storage'

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { NotFoundError } from '@nexus/core/http'
import { afterEach, describe, expect, it } from 'bun:test'

import { CosMediaStorage } from './cos-media-storage'
import { LocalMediaStorage } from './local-media-storage'

const outsideFilePath = resolve(import.meta.dir, '../../../storage/media-storage-test-outside.txt')
const testStorageDirs = new Set<string>()

async function cleanupPath(filePath: string) {
  await rm(filePath, { force: true, recursive: true }).catch(() => undefined)
}

async function createLocalStorage() {
  const rootDir = await mkdtemp(join(tmpdir(), 'xdd-nexus-media-test-'))
  testStorageDirs.add(rootDir)

  return {
    rootDir,
    storage: new LocalMediaStorage(rootDir),
  }
}

afterEach(async () => {
  for (const rootDir of testStorageDirs) {
    await cleanupPath(rootDir)
  }

  testStorageDirs.clear()
  await cleanupPath(outsideFilePath)
})

describe('LocalMediaStorage', () => {
  it('保存文件时应使用固定的媒体目录', async () => {
    const { rootDir, storage } = await createLocalStorage()
    const file = new File(['hello media'], 'avatar.php', {
      type: 'image/jpeg',
    })

    const result = await storage.save(file)

    expect(result.fileName).toEndWith('.jpg')
    expect(result.storagePath).toBe(result.fileName)
    expect(await readFile(resolve(rootDir, result.storagePath), 'utf8')).toBe('hello media')
  })

  it('打开文件时应返回文件内容和下载头', async () => {
    const { storage } = await createLocalStorage()
    const result = await storage.save(
      new File(['hello media'], 'avatar.php', {
        type: 'image/png',
      }),
    )

    const response = await storage.openFile(result.storagePath, {
      originalName: '头像.png',
      mimeType: 'image/png',
      size: 11,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('content-length')).toBe('11')
    expect(response.headers.get('content-disposition')).toBe(`inline; filename="${encodeURIComponent('头像.png')}"`)
    expect(await response.text()).toBe('hello media')
  })

  it('读取和删除文件时应拒绝访问存储目录外的路径', async () => {
    await writeFile(outsideFilePath, 'outside media')
    const storage = new LocalMediaStorage()

    await expect(
      storage.openFile(outsideFilePath, {
        originalName: 'outside.txt',
        mimeType: 'text/plain',
        size: 13,
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
    await expect(storage.remove(outsideFilePath)).rejects.toBeInstanceOf(NotFoundError)

    expect(await readFile(outsideFilePath, 'utf8')).toBe('outside media')
  })
})

describe('CosMediaStorage', () => {
  function createStorage(client: CosSdkClient) {
    return new CosMediaStorage(
      {
        bucket: 'xdd-elysia-1307783937',
        keyPrefix: 'media',
        region: 'ap-shanghai',
        secretId: 'secret-id',
        secretKey: 'secret-key',
        signedUrlExpires: 600,
      },
      client,
    )
  }

  function createPublicStorage(client: CosSdkClient) {
    return new CosMediaStorage(
      {
        bucket: 'xdd-elysia-1307783937',
        keyPrefix: 'media',
        publicBaseUrl: 'https://cos.example',
        region: 'ap-shanghai',
        secretId: 'secret-id',
        secretKey: 'secret-key',
        signedUrlExpires: 600,
      },
      client,
    )
  }

  it('保存文件时应上传到配置的 bucket、region 和 keyPrefix', async () => {
    const calls: unknown[] = []
    const client: CosSdkClient = {
      deleteObject: async () => ({}),
      getObjectUrl: () => 'https://cos.example/media/avatar.png',
      putObject: async (params) => {
        calls.push(params)
        return { ETag: '"etag"', Location: 'example' }
      },
    }

    const storage = createStorage(client)
    const result = await storage.save(
      new File(['hello cos'], 'avatar.php', {
        type: 'image/png',
      }),
    )

    expect(result.fileName).toEndWith('.png')
    expect(result.storagePath).toBe(`media/${result.fileName}`)
    expect(calls).toEqual([
      {
        Body: Buffer.from('hello cos'),
        Bucket: 'xdd-elysia-1307783937',
        ContentLength: 9,
        ContentType: 'image/png',
        Key: result.storagePath,
        Region: 'ap-shanghai',
      },
    ])
  })

  it('配置公开地址时保存结果应返回公开 URL', async () => {
    const storage = createPublicStorage({
      deleteObject: async () => ({}),
      getObjectUrl: () => 'https://signed.example/media/avatar.png',
      putObject: async () => ({ ETag: '"etag"', Location: 'example' }),
    })

    const result = await storage.save(
      new File(['hello cos'], 'avatar.php', {
        type: 'image/png',
      }),
    )

    expect(result.publicUrl).toBe(`https://cos.example/media/${result.fileName}`)
  })

  it('读取文件时应返回 COS 跳转地址', async () => {
    const storage = createStorage({
      deleteObject: async () => ({}),
      getObjectUrl: () => 'https://cos.example/media/avatar.png',
      putObject: async () => ({ ETag: '"etag"', Location: 'example' }),
    })

    const response = await storage.openFile('media/avatar.png', {
      originalName: 'avatar.png',
      mimeType: 'image/png',
      size: 9,
    })

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://cos.example/media/avatar.png')
  })

  it('COS 返回 404 时应转成 NotFoundError', async () => {
    const error = new Error('not found')
    Object.assign(error, {
      code: 'NoSuchKey',
      error: 'not found',
      method: 'GET',
      statusCode: 404,
      url: 'https://cos.example/media/avatar.png',
    })

    const storage = createStorage({
      deleteObject: async () => ({}),
      getObjectUrl: () => {
        throw error
      },
      putObject: async () => ({ ETag: '"etag"', Location: 'example' }),
    })

    await expect(
      storage.openFile('media/avatar.png', {
        originalName: 'avatar.png',
        mimeType: 'image/png',
        size: 9,
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('删除文件时应调用 deleteObject', async () => {
    const calls: unknown[] = []
    const storage = createStorage({
      deleteObject: async (params) => {
        calls.push(params)
        return {}
      },
      getObjectUrl: () => 'https://cos.example/media/avatar.png',
      putObject: async () => ({ ETag: '"etag"', Location: 'example' }),
    })

    await storage.remove('media/avatar.png')

    expect(calls).toEqual([
      {
        Bucket: 'xdd-elysia-1307783937',
        Key: 'media/avatar.png',
        Region: 'ap-shanghai',
      },
    ])
  })
})
