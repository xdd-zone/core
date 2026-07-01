import type {
  StorageDriver,
  StorageFileStat,
  StorageOpenFileOptions,
  StorageSaveOptions,
  StorageSaveResult,
} from './storage.types'
import { access, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { BizCode } from '@xdd-zone/contracts'
import { AppError } from '#momo/shared/app-error'

import { createMediaFileName, validateMediaFile } from './media-file'
import { joinStoragePath, validateStorageDirectory, validateStoragePath } from './storage-path'

/** 防止路径遍历：resolve 后必须仍在 rootDir 内 */
function resolveAndValidatePath(rootDir: string, storagePath: string): string {
  validateStoragePath(storagePath)
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

  async save(file: File, options?: StorageSaveOptions): Promise<StorageSaveResult> {
    validateMediaFile(file)

    if (options?.directory !== undefined) {
      validateStorageDirectory(options.directory)
    }

    const fileName = createMediaFileName(file)
    const storagePath = options?.directory !== undefined ? joinStoragePath(options.directory, fileName) : fileName
    const filePath = resolveAndValidatePath(this.rootDir, storagePath)

    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, new Uint8Array(await file.arrayBuffer()))
    return { fileName, storagePath }
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

  async stat(storagePath: string): Promise<StorageFileStat> {
    const filePath = resolveAndValidatePath(this.rootDir, storagePath)

    try {
      const fileStat = await stat(filePath)
      return {
        storagePath,
        size: fileStat.size,
        lastModified: fileStat.mtime,
      }
    } catch {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文件不存在', 404)
    }
  }
}
