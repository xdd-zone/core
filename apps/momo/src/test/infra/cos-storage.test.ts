import type { CosStorageClient, CosStorageConfig } from '#momo/infra/storage/cos-storage'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CosStorage } from '#momo/infra/storage/cos-storage'
import { MAX_MEDIA_FILE_SIZE_BYTES } from '#momo/infra/storage/media-file'

function createConfig(config: Partial<CosStorageConfig> = {}): CosStorageConfig {
  return {
    secretId: 'secret-id',
    secretKey: 'secret-key',
    bucket: 'examplebucket-1250000000',
    region: 'ap-shanghai',
    keyPrefix: 'media',
    signedUrlExpires: 600,
    ...config,
  }
}

function createMockClient(): CosStorageClient {
  return {
    putObject: vi.fn().mockResolvedValue({}),
    deleteObject: vi.fn().mockResolvedValue({}),
    getObjectUrl: vi.fn().mockReturnValue('https://signed.example.com/media/file.png'),
    headBucket: vi.fn().mockResolvedValue({}),
    headObject: vi.fn().mockResolvedValue({
      ETag: '"etag"',
      headers: {
        'content-length': '13',
        'content-type': 'image/png',
        'last-modified': 'Wed, 01 Jan 2025 00:00:00 GMT',
      },
    }),
  }
}

function createTestFile(name = 'photo.png', content = 'png-data', type = 'image/png'): File {
  return new File([Buffer.from(content)], name, { type })
}

describe('cos 存储', () => {
  let client: CosStorageClient

  beforeEach(() => {
    client = createMockClient()
  })

  describe('health 检查', () => {
    it('bucket 可访问时返回 available', async () => {
      const storage = new CosStorage(createConfig(), client)

      await expect(storage.health()).resolves.toEqual({ status: 'available' })
      expect(client.headBucket).toHaveBeenCalledWith({
        Bucket: 'examplebucket-1250000000',
        Region: 'ap-shanghai',
      })
    })
  })

  describe('save 文件', () => {
    it('putObject 调用后返回 storagePath', async () => {
      const storage = new CosStorage(createConfig(), client)
      const file = createTestFile()

      const result = await storage.save(file)

      expect(result.fileName).toMatch(/^[a-f0-9-]+\.png$/)
      expect(result.storagePath).toBe(`media/${result.fileName}`)
      expect(client.putObject).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'examplebucket-1250000000',
          Region: 'ap-shanghai',
          Key: result.storagePath,
          ContentLength: file.size,
          ContentType: 'image/png',
        }),
      )
    })

    it('publicUrl 存在时返回 publicUrl', async () => {
      const storage = new CosStorage(createConfig({ publicBaseUrl: 'https://cdn.example.com/media/' }), client)

      const result = await storage.save(createTestFile())

      expect(result.publicUrl).toBe(`https://cdn.example.com/media/${result.storagePath}`)
    })

    it('保存到指定目录', async () => {
      const storage = new CosStorage(createConfig(), client)
      const file = createTestFile('avatar.webp', 'webp-data', 'image/webp')

      const result = await storage.save(file, { directory: 'avatars' })

      expect(result.fileName).toMatch(/^[a-f0-9-]+\.webp$/)
      expect(result.storagePath).toBe(`media/avatars/${result.fileName}`)
      expect(client.putObject).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: result.storagePath,
          ContentLength: file.size,
          ContentType: 'image/webp',
        }),
      )
    })

    it.each(['', '/avatars', '../avatars', 'avatars//files', 'avatars/../files', 'avatars\\files'])(
      '保存目录 %s 非法时抛错',
      async (directory) => {
        const storage = new CosStorage(createConfig(), client)

        await expect(storage.save(createTestFile(), { directory })).rejects.toThrow('文件不存在')
        expect(client.putObject).not.toHaveBeenCalled()
      },
    )

    it('mime 非法类型被拒绝', async () => {
      const storage = new CosStorage(createConfig(), client)

      await expect(storage.save(createTestFile('document.pdf', 'pdf-data', 'application/pdf'))).rejects.toThrow(
        '不支持的文件类型',
      )
      expect(client.putObject).not.toHaveBeenCalled()
    })

    it('size 超过 10 MiB 的文件被拒绝', async () => {
      const storage = new CosStorage(createConfig(), client)
      const file = new File([new Uint8Array(MAX_MEDIA_FILE_SIZE_BYTES + 1)], 'large.png', { type: 'image/png' })

      await expect(storage.save(file)).rejects.toThrow('文件大小不能超过 10 MiB')
      expect(client.putObject).not.toHaveBeenCalled()
    })
  })

  describe('open 文件', () => {
    it('publicBaseUrl 存在时返回公开地址', async () => {
      const storage = new CosStorage(createConfig({ publicBaseUrl: 'https://cdn.example.com/media/' }), client)

      const response = await storage.openFile('media/file.png', {
        originalName: 'file.png',
        mimeType: 'image/png',
        size: 13,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe('https://cdn.example.com/media/media/file.png')
      expect(client.getObjectUrl).not.toHaveBeenCalled()
    })

    it('publicBaseUrl 不存在时返回签名地址', async () => {
      const storage = new CosStorage(createConfig(), client)

      const response = await storage.openFile('media/file.png', {
        originalName: 'file.png',
        mimeType: 'image/png',
        size: 13,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe('https://signed.example.com/media/file.png')
      expect(client.getObjectUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'examplebucket-1250000000',
          Region: 'ap-shanghai',
          Key: 'media/file.png',
          Expires: 600,
          Sign: true,
        }),
      )
    })
  })

  describe('remove 文件', () => {
    it('deleteObject 会被调用', async () => {
      const storage = new CosStorage(createConfig(), client)

      await storage.remove('media/file.png')

      expect(client.deleteObject).toHaveBeenCalledWith({
        Bucket: 'examplebucket-1250000000',
        Key: 'media/file.png',
        Region: 'ap-shanghai',
      })
    })
  })

  describe('stat 文件状态', () => {
    it('headObject 调用后返回文件状态', async () => {
      const storage = new CosStorage(createConfig(), client)

      const result = await storage.stat('media/file.png')

      expect(client.headObject).toHaveBeenCalledWith({
        Bucket: 'examplebucket-1250000000',
        Key: 'media/file.png',
        Region: 'ap-shanghai',
      })
      expect(result).toEqual({
        storagePath: 'media/file.png',
        size: 13,
        mimeType: 'image/png',
        lastModified: new Date('Wed, 01 Jan 2025 00:00:00 GMT'),
      })
    })
  })

  describe('error 处理', () => {
    it('cos 404 转成文件不存在', async () => {
      vi.mocked(client.headObject).mockRejectedValue({ statusCode: 404 })
      const storage = new CosStorage(createConfig(), client)

      await expect(storage.stat('media/missing.png')).rejects.toThrow('文件不存在')
    })

    it.each([401, 403])('cos %s 转成权限不足', async (statusCode) => {
      vi.mocked(client.headObject).mockRejectedValue({ statusCode })
      const storage = new CosStorage(createConfig(), client)

      await expect(storage.stat('media/file.png')).rejects.toThrow('文件存储权限不足')
    })

    it('other COS 错误转成访问失败', async () => {
      vi.mocked(client.headObject).mockRejectedValue({ statusCode: 500 })
      const storage = new CosStorage(createConfig(), client)

      await expect(storage.stat('media/file.png')).rejects.toThrow('文件存储访问失败')
    })

    it.each(['', '/tmp/file.png', 'nested//file.png', 'nested/../file.png', 'nested\\file.png'])(
      'invalid path %s 时抛错',
      async (storagePath) => {
        const storage = new CosStorage(createConfig(), client)

        await expect(storage.stat(storagePath)).rejects.toThrow('文件不存在')
      },
    )
  })
})
