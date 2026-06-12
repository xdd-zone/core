import type { StorageDriver, StorageOpenFileOptions, StorageSaveResult } from './storage.types'
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { AppError } from '#momo/shared/app-error'
import { BizCode } from '@xdd-zone/contracts'

import { createMediaFileName } from './media-file'

/** 防止路径遍历：resolve 后必须仍在 rootDir 内 */
function resolveAndValidatePath(rootDir: string, storagePath: string): string {
  const resolvedPath = resolve(rootDir, storagePath)
  const relativePath = relative(rootDir, resolvedPath)

  if (!relativePath || relativePath.startsWith('..')) {
    throw new AppError(BizCode.COMMON_NOT_FOUND, '文件不存在', 404)
  }

  return resolvedPath
}

/** 本地文件存储驱动 */
export class LocalStorage implements StorageDriver {
  constructor(private readonly rootDir: string) {}

  async save(file: File): Promise<StorageSaveResult> {
    await mkdir(this.rootDir, { recursive: true })
    const fileName = createMediaFileName(file)
    const filePath = join(this.rootDir, fileName)
    await writeFile(filePath, new Uint8Array(await file.arrayBuffer()))
    return { fileName, storagePath: fileName }
  }

  async openFile(storagePath: string, options: StorageOpenFileOptions): Promise<Response> {
    const filePath = resolveAndValidatePath(this.rootDir, storagePath)

    try {
      await access(filePath)
    } catch {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文件不存在', 404)
    }

    const content = await readFile(filePath)
    return new Response(content, {
      status: 200,
      headers: {
        'content-disposition': `inline; filename="${encodeURIComponent(options.originalName)}"`,
        'content-length': String(options.size),
        'content-type': options.mimeType,
      },
    })
  }

  async remove(storagePath: string): Promise<void> {
    const filePath = resolveAndValidatePath(this.rootDir, storagePath)
    await rm(filePath, { force: true })
  }
}
