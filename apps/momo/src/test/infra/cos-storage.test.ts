import type { CosStorageClient, CosStorageConfig } from '#momo/infra/storage/cos-storage'
import { CosStorage } from '#momo/infra/storage/cos-storage'
import { MAX_MEDIA_FILE_SIZE_BYTES } from '#momo/infra/storage/media-file'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('cos storage', () => {
  let client: CosStorageClient

  beforeEach(() => {
    client = createMockClient()
  })

  describe('save', () => {
    it('调用 putObject 并返回 storagePath', async () => {
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

    it('有公开域名时返回 publicUrl', async () => {
      const storage = new CosStorage(createConfig({ publicBaseUrl: 'https://cdn.example.com/media/' }), client)

      const result = await storage.save(createTestFile())

      expect(result.publicUrl).toBe(`https://cdn.example.com/media/${result.storagePath}`)
    })

    it('拒绝非法 MIME 类型', async () => {
      const storage = new CosStorage(createConfig(), client)

      await expect(storage.save(createTestFile('document.pdf', 'pdf-data', 'application/pdf'))).rejects.toThrow(
        '不支持的文件类型',
      )
      expect(client.putObject).not.toHaveBeenCalled()
    })

    it('拒绝超过 10 MiB 的文件', async () => {
      const storage = new CosStorage(createConfig(), client)
      const file = new File([new Uint8Array(MAX_MEDIA_FILE_SIZE_BYTES + 1)], 'large.png', { type: 'image/png' })

      await expect(storage.save(file)).rejects.toThrow('文件大小不能超过 10 MiB')
      expect(client.putObject).not.toHaveBeenCalled()
    })
  })

  describe('openFile', () => {
    it('有公开域名时返回公开地址', async () => {
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

    it('没有公开域名时返回签名地址', async () => {
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

  describe('remove', () => {
    it('调用 deleteObject', async () => {
      const storage = new CosStorage(createConfig(), client)

      await storage.remove('media/file.png')

      expect(client.deleteObject).toHaveBeenCalledWith({
        Bucket: 'examplebucket-1250000000',
        Key: 'media/file.png',
        Region: 'ap-shanghai',
      })
    })
  })

  describe('stat', () => {
    it('调用 headObject 并返回文件状态', async () => {
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

  describe('error handling', () => {
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

    it('其他 COS 错误转成访问失败', async () => {
      vi.mocked(client.headObject).mockRejectedValue({ statusCode: 500 })
      const storage = new CosStorage(createConfig(), client)

      await expect(storage.stat('media/file.png')).rejects.toThrow('文件存储访问失败')
    })

    it.each(['', '/tmp/file.png', 'nested/../file.png', 'nested\\file.png'])('非法路径 %s 时抛错', async (storagePath) => {
      const storage = new CosStorage(createConfig(), client)

      await expect(storage.stat(storagePath)).rejects.toThrow('文件不存在')
    })
  })
})
