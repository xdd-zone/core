import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LocalStorage } from '#momo/infra/storage/local-storage'
import { MAX_MEDIA_FILE_SIZE_BYTES } from '#momo/infra/storage/media-file'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

function createTestFile(name: string, content: string, type: string): File {
  return new File([Buffer.from(content)], name, { type })
}

describe('local storage', () => {
  let tmpDir: string
  let storage: LocalStorage

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'momo-storage-test-'))
    storage = new LocalStorage(tmpDir)
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  describe('save', () => {
    it('写入文件并返回 storagePath', async () => {
      const file = createTestFile('photo.png', 'png-data', 'image/png')
      const result = await storage.save(file)

      expect(result.fileName).toMatch(/^[a-f0-9-]+\.png$/)
      expect(result.storagePath).toBe(result.fileName)
      expect(result.publicUrl).toBeUndefined()

      const written = await readFile(join(tmpDir, result.storagePath), 'utf-8')
      expect(written).toBe('png-data')
    })

    it('自动创建存储目录', async () => {
      const nestedDir = join(tmpDir, 'nested', 'dir')
      const nestedStorage = new LocalStorage(nestedDir)

      const file = createTestFile('test.jpg', 'jpg-data', 'image/jpeg')
      const result = await nestedStorage.save(file)

      const written = await readFile(join(nestedDir, result.storagePath), 'utf-8')
      expect(written).toBe('jpg-data')
    })

    it('拒绝非法 MIME 类型', async () => {
      const file = createTestFile('document.pdf', 'pdf-data', 'application/pdf')

      await expect(storage.save(file)).rejects.toThrow('不支持的文件类型')
    })

    it('拒绝超过 10 MiB 的文件', async () => {
      const file = new File([new Uint8Array(MAX_MEDIA_FILE_SIZE_BYTES + 1)], 'large.png', { type: 'image/png' })

      await expect(storage.save(file)).rejects.toThrow('文件大小不能超过 10 MiB')
    })
  })

  describe('openFile', () => {
    it('返回 200 和文件内容', async () => {
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

    it('文件不存在时抛错', async () => {
      await expect(
        storage.openFile('nonexistent.png', {
          originalName: 'nonexistent.png',
          mimeType: 'image/png',
          size: 0,
        }),
      ).rejects.toThrow('文件不存在')
    })

    it('路径遍历时抛错', async () => {
      await expect(
        storage.openFile('../../../etc/passwd', {
          originalName: 'passwd',
          mimeType: 'text/plain',
          size: 0,
        }),
      ).rejects.toThrow('文件不存在')
    })

    it.each(['', '/tmp/file.png', 'nested/../file.png', 'nested\\file.png'])(
      '非法路径 %s 时抛错',
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

  describe('remove', () => {
    it('删除已存在的文件', async () => {
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

    it('删除不存在的文件不报错', async () => {
      await expect(storage.remove('nonexistent-file.png')).resolves.not.toThrow()
    })

    it.each(['', '/tmp/file.png', 'nested/../file.png', 'nested\\file.png'])(
      '非法路径 %s 时抛错',
      async (storagePath) => {
        await expect(storage.remove(storagePath)).rejects.toThrow('文件不存在')
      },
    )
  })

  describe('stat', () => {
    it('返回文件状态', async () => {
      const file = createTestFile('hello.png', 'hello-content', 'image/png')
      const { storagePath } = await storage.save(file)

      const result = await storage.stat(storagePath)

      expect(result.storagePath).toBe(storagePath)
      expect(result.size).toBe(13)
      expect(result.mimeType).toBeUndefined()
      expect(result.lastModified).toBeInstanceOf(Date)
    })

    it('文件不存在时抛错', async () => {
      await expect(storage.stat('nonexistent.png')).rejects.toThrow('文件不存在')
    })

    it.each(['', '/tmp/file.png', 'nested/../file.png', 'nested\\file.png'])(
      '非法路径 %s 时抛错',
      async (storagePath) => {
        await expect(storage.stat(storagePath)).rejects.toThrow('文件不存在')
      },
    )
  })
})
