import { describe, expect, it } from 'vitest'
import {
  createMediaFileName,
  isAllowedMediaMimeType,
  MAX_MEDIA_FILE_SIZE_BYTES,
  validateMediaFile,
} from '#momo/infra/storage/media-file'

describe('mime 类型白名单判断', () => {
  it.each(['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'])('%s 在白名单内', (mimeType) => {
    expect(isAllowedMediaMimeType(mimeType)).toBe(true)
  })

  it.each(['text/plain', 'application/pdf', 'video/mp4', 'image/svg+xml'])('%s 不在白名单内', (mimeType) => {
    expect(isAllowedMediaMimeType(mimeType)).toBe(false)
  })
})

describe('创建媒体文件名', () => {
  it('whitelist MIME 类型使用映射的扩展名', () => {
    const file = new File([Buffer.from('x')], 'photo.PNG', { type: 'image/png' })
    const name = createMediaFileName(file)

    expect(name).toMatch(/^[a-f0-9-]{36}\.png$/)
  })

  it('fallback MIME 类型使用原始文件扩展名', () => {
    const file = new File([Buffer.from('x')], 'document.pdf', { type: 'application/pdf' })
    const name = createMediaFileName(file)

    expect(name).toMatch(/^[a-f0-9-]{36}\.pdf$/)
  })

  it('generate 时生成不同的文件名', () => {
    const file = new File([Buffer.from('x')], 'test.jpg', { type: 'image/jpeg' })
    const name1 = createMediaFileName(file)
    const name2 = createMediaFileName(file)

    expect(name1).not.toBe(name2)
  })
})

describe('校验媒体文件', () => {
  it('valid 白名单 MIME 类型和未超限文件', () => {
    const file = new File([Buffer.from('x')], 'photo.png', { type: 'image/png' })

    expect(() => validateMediaFile(file)).not.toThrow()
  })

  it('invalid 非白名单 MIME 类型被拒绝', () => {
    const file = new File([Buffer.from('x')], 'document.pdf', { type: 'application/pdf' })

    expect(() => validateMediaFile(file)).toThrow('不支持的文件类型')
  })

  it('size 超过 10 MiB 的文件被拒绝', () => {
    const file = new File([new Uint8Array(MAX_MEDIA_FILE_SIZE_BYTES + 1)], 'large.png', { type: 'image/png' })

    expect(() => validateMediaFile(file)).toThrow('文件大小不能超过 10 MiB')
  })
})
