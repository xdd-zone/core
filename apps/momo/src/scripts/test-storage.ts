import type { StorageOpenFileOptions, StorageSaveResult } from '#momo/infra/storage'
import { createRuntime } from '#momo/bootstrap'

const testContentText = 'hello momo storage'
const testContent = Buffer.from(testContentText)
const testFileName = 'test-image.png'
const testFileType = 'image/png'

function assertStorageCheck(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function formatLocationForLog(location: string): string {
  try {
    const url = new URL(location)
    return `${url.origin}${url.pathname}`
  } catch {
    return '[无法解析 URL]'
  }
}

function createOpenFileOptions(): StorageOpenFileOptions {
  return {
    originalName: testFileName,
    mimeType: testFileType,
    size: testContent.length,
  }
}

async function main() {
  const runtime = createRuntime()
  const storage = runtime.storage
  const provider = runtime.env.STORAGE_PROVIDER
  const testFile = new File([testContent], testFileName, { type: testFileType })
  let saved: StorageSaveResult | undefined

  console.log(`存储驱动: ${provider}`)

  try {
    saved = await storage.save(testFile)
    console.log('save 结果:', saved)

    assertStorageCheck(saved.fileName.endsWith('.png'), 'save 返回的文件名扩展名不是 .png')
    assertStorageCheck(saved.storagePath.length > 0, 'save 没有返回 storagePath')

    const response = await storage.openFile(saved.storagePath, createOpenFileOptions())
    console.log('openFile 状态:', response.status)

    if (provider === 'cos') {
      const location = response.headers.get('location')

      assertStorageCheck(response.status === 302, 'COS openFile 没有返回 302')
      assertStorageCheck(location, 'COS openFile 没有返回 location header')
      console.log('openFile 跳转地址:', formatLocationForLog(location))
    } else {
      const body = await response.text()
      assertStorageCheck(response.status === 200, '本地 openFile 没有返回 200')
      assertStorageCheck(body === testContentText, '本地 openFile 返回内容不匹配')
      console.log('openFile 内容匹配: PASS')
    }

    await storage.remove(saved.storagePath)
    console.log('remove: 完成')

    if (provider === 'local') {
      let removed = false

      try {
        await storage.openFile(saved.storagePath, createOpenFileOptions())
      } catch {
        removed = true
      }

      assertStorageCheck(removed, '本地 remove 后文件仍可读取')
      console.log('remove 验证: PASS')
    } else {
      console.log('remove 验证: 已调用 COS deleteObject')
    }
  } finally {
    if (saved) {
      await storage.remove(saved.storagePath).catch(() => {})
    }
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
