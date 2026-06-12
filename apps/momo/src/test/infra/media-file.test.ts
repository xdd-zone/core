import { createMediaFileName, isAllowedMediaMimeType } from '#momo/infra/storage/media-file'
import { describe, expect, it } from 'vitest'

describe('isAllowedMediaMimeType', () => {
  it.each(['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'])('%s 在白名单内', (mimeType) => {
    expect(isAllowedMediaMimeType(mimeType)).toBe(true)
  })

  it.each(['text/plain', 'application/pdf', 'video/mp4', 'image/svg+xml'])('%s 不在白名单内', (mimeType) => {
    expect(isAllowedMediaMimeType(mimeType)).toBe(false)
  })
})

describe('createMediaFileName', () => {
  it('白名单 MIME 类型使用映射的扩展名', () => {
    const file = new File([Buffer.from('x')], 'photo.PNG', { type: 'image/png' })
    const name = createMediaFileName(file)

    expect(name).toMatch(/^[a-f0-9-]{36}\.png$/)
  })

  it('非白名单 MIME 类型使用原始文件扩展名', () => {
    const file = new File([Buffer.from('x')], 'document.pdf', { type: 'application/pdf' })
    const name = createMediaFileName(file)

    expect(name).toMatch(/^[a-f0-9-]{36}\.pdf$/)
  })

  it('每次调用生成不同的文件名', () => {
    const file = new File([Buffer.from('x')], 'test.jpg', { type: 'image/jpeg' })
    const name1 = createMediaFileName(file)
    const name2 = createMediaFileName(file)

    expect(name1).not.toBe(name2)
  })
})
