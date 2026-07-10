import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LocalStorage } from '#momo/infra/storage/local-storage'
import { MAX_MEDIA_FILE_SIZE_BYTES } from '#momo/infra/storage/media-file'

function createTestFile(name: string, content: string, type: string): File {
  return new File([Buffer.from(content)], name, { type })
}

describe('local 存储', () => {
  let tmpDir: string
  let storage: LocalStorage

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'momo-storage-test-'))
    storage = new LocalStorage(tmpDir)
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  describe('health 检查', () => {
    it('存储目录可读写时返回 available', async () => {
      await expect(storage.health()).resolves.toEqual({ status: 'available' })
    })

    it('目录不存在时会创建目录', async () => {
      const nestedStorage = new LocalStorage(join(tmpDir, 'health', 'nested'))

      await expect(nestedStorage.health()).resolves.toEqual({ status: 'available' })
    })
  })

  describe('save 文件', () => {
    it('write 文件并返回 storagePath', async () => {
      const file = createTestFile('photo.png', 'png-data', 'image/png')
      const result = await storage.save(file)

      expect(result.fileName).toMatch(/^[a-f0-9-]+\.png$/)
      expect(result.storagePath).toBe(result.fileName)
      expect(result.publicUrl).toBeUndefined()

      const written = await readFile(join(tmpDir, result.storagePath), 'utf-8')
      expect(written).toBe('png-data')
    })

    it('create 时自动创建存储目录', async () => {
      const nestedDir = join(tmpDir, 'nested', 'dir')
      const nestedStorage = new LocalStorage(nestedDir)

      const file = createTestFile('test.jpg', 'jpg-data', 'image/jpeg')
      const result = await nestedStorage.save(file)

      const written = await readFile(join(nestedDir, result.storagePath), 'utf-8')
      expect(written).toBe('jpg-data')
    })

    it('保存到指定目录', async () => {
      const file = createTestFile('avatar.webp', 'webp-data', 'image/webp')
      const result = await storage.save(file, { directory: 'avatars' })

      expect(result.fileName).toMatch(/^[a-f0-9-]+\.webp$/)
      expect(result.storagePath).toBe(`avatars/${result.fileName}`)
      expect(result.publicUrl).toBeUndefined()

      const written = await readFile(join(tmpDir, result.storagePath), 'utf-8')
      expect(written).toBe('webp-data')
    })

    it.each(['', '/avatars', '../avatars', 'avatars//files', 'avatars/../files', 'avatars\\files'])(
      '保存目录 %s 非法时抛错',
      async (directory) => {
        const file = createTestFile('avatar.webp', 'webp-data', 'image/webp')

        await expect(storage.save(file, { directory })).rejects.toThrow('文件不存在')
      },
    )

    it('mime 非法类型被拒绝', async () => {
      const file = createTestFile('document.pdf', 'pdf-data', 'application/pdf')

      await expect(storage.save(file)).rejects.toThrow('不支持的文件类型')
    })

    it('size 超过 10 MiB 的文件被拒绝', async () => {
      const file = new File([new Uint8Array(MAX_MEDIA_FILE_SIZE_BYTES + 1)], 'large.png', { type: 'image/png' })

      await expect(storage.save(file)).rejects.toThrow('文件大小不能超过 10 MiB')
    })
  })

  describe('open 文件', () => {
    it('open 后返回 200 和文件内容', async () => {
      const file = createTestFile('hello.png', 'hello-content', 'image/png')
      const { storagePath } = await storage.save(file)

      const response = await storage.openFile(storagePath, {
        originalName: 'hello.png',
        mimeType: 'image/png',
        size: 13,
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('image/png')
      expect(response.headers.get('content-length')).toBe('13')

      const body = await response.text()
      expect(body).toBe('hello-content')
    })

    it('file 不存在时抛错', async () => {
      await expect(
        storage.openFile('nonexistent.png', {
          originalName: 'nonexistent.png',
          mimeType: 'image/png',
          size: 0,
        }),
      ).rejects.toThrow('文件不存在')
    })

    it('path traversal 时抛错', async () => {
      await expect(
        storage.openFile('../../../etc/passwd', {
          originalName: 'passwd',
          mimeType: 'text/plain',
          size: 0,
        }),
      ).rejects.toThrow('文件不存在')
    })

    it.each(['', '/tmp/file.png', 'nested//file.png', 'nested/../file.png', 'nested\\file.png'])(
      'invalid path %s 时抛错',
      async (storagePath) => {
        await expect(
          storage.openFile(storagePath, {
            originalName: 'file.png',
            mimeType: 'image/png',
            size: 0,
          }),
        ).rejects.toThrow('文件不存在')
      },
    )
  })

  describe('remove 文件', () => {
    it('remove 已存在的文件', async () => {
      const file = createTestFile('to-delete.png', 'delete-me', 'image/png')
      const { storagePath } = await storage.save(file)

      await storage.remove(storagePath)

      await expect(
        storage.openFile(storagePath, {
          originalName: 'to-delete.png',
          mimeType: 'image/png',
          size: 9,
        }),
      ).rejects.toThrow('文件不存在')
    })

    it('remove 不存在的文件不报错', async () => {
      await expect(storage.remove('nonexistent-file.png')).resolves.not.toThrow()
    })

    it.each(['', '/tmp/file.png', 'nested//file.png', 'nested/../file.png', 'nested\\file.png'])(
      'invalid path %s 时抛错',
      async (storagePath) => {
        await expect(storage.remove(storagePath)).rejects.toThrow('文件不存在')
      },
    )
  })

  describe('stat 文件状态', () => {
    it('stat 返回文件状态', async () => {
      const file = createTestFile('hello.png', 'hello-content', 'image/png')
      const { storagePath } = await storage.save(file)

      const result = await storage.stat(storagePath)

      expect(result.storagePath).toBe(storagePath)
      expect(result.size).toBe(13)
      expect(result.mimeType).toBeUndefined()
      expect(result.lastModified).toBeInstanceOf(Date)
    })

    it('file 不存在时抛错', async () => {
      await expect(storage.stat('nonexistent.png')).rejects.toThrow('文件不存在')
    })

    it.each(['', '/tmp/file.png', 'nested//file.png', 'nested/../file.png', 'nested\\file.png'])(
      'invalid path %s 时抛错',
      async (storagePath) => {
        await expect(storage.stat(storagePath)).rejects.toThrow('文件不存在')
      },
    )
  })
})
