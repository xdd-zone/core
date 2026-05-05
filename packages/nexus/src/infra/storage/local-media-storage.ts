import type { MediaStorageDriver, MediaStorageOpenFileOptions, MediaStorageSaveResult } from './media-storage.types'
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { NotFoundError } from '@nexus/core/http'

import { createMediaFileName } from './media-file'

const NEXUS_PACKAGE_NAME = '@xdd-zone/nexus'
const MODULE_DIR = dirname(fileURLToPath(import.meta.url))

async function isNexusPackageRoot(dir: string): Promise<boolean> {
  const packageJsonPath = join(dir, 'package.json')

  try {
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as { name?: string }
    return packageJson.name === NEXUS_PACKAGE_NAME
  } catch {
    return false
  }
}

async function findNexusPackageRoot(startDir: string): Promise<string | null> {
  let currentDir = resolve(startDir)

  while (true) {
    if (await isNexusPackageRoot(currentDir)) {
      return currentDir
    }

    const parentDir = dirname(currentDir)
    if (parentDir === currentDir) {
      return null
    }

    currentDir = parentDir
  }
}

async function resolveNexusPackageRoot(fromDir: string = MODULE_DIR): Promise<string> {
  const cwdRoot = await findNexusPackageRoot(process.cwd())
  if (cwdRoot) {
    return cwdRoot
  }

  const nestedCwdRoot = resolve(process.cwd(), 'packages/nexus')
  if (await isNexusPackageRoot(nestedCwdRoot)) {
    return nestedCwdRoot
  }

  const moduleRoot = await findNexusPackageRoot(fromDir)
  if (moduleRoot) {
    return moduleRoot
  }

  throw new Error('无法定位 @xdd-zone/nexus 包目录')
}

export async function resolveMediaStorageDir(fromDir: string = MODULE_DIR): Promise<string> {
  const nexusPackageRoot = await resolveNexusPackageRoot(fromDir)
  return join(nexusPackageRoot, 'storage/media')
}

async function resolveMediaStoragePath(storagePath: string): Promise<string> {
  const mediaStorageDir = await resolveMediaStorageDir()
  const resolvedPath = resolve(mediaStorageDir, storagePath)
  const relativePath = relative(mediaStorageDir, resolvedPath)

  if (!relativePath || relativePath.startsWith('..')) {
    throw new NotFoundError('媒体文件不存在')
  }

  return resolvedPath
}

export class LocalMediaStorage implements MediaStorageDriver {
  async save(file: File): Promise<MediaStorageSaveResult> {
    const mediaStorageDir = await resolveMediaStorageDir()
    await mkdir(mediaStorageDir, { recursive: true })

    const fileName = createMediaFileName(file)
    const resolvedPath = join(mediaStorageDir, fileName)

    await writeFile(resolvedPath, new Uint8Array(await file.arrayBuffer()))

    return {
      fileName,
      storagePath: fileName,
    }
  }

  async openFile(storagePath: string, options: MediaStorageOpenFileOptions): Promise<Response> {
    const resolvedPath = await resolveMediaStoragePath(storagePath)

    try {
      await access(resolvedPath)
    } catch {
      throw new NotFoundError('媒体文件不存在')
    }

    return new Response(Bun.file(resolvedPath), {
      headers: {
        'content-disposition': `inline; filename="${encodeURIComponent(options.originalName)}"`,
        'content-length': String(options.size),
        'content-type': options.mimeType,
      },
      status: 200,
    })
  }

  async remove(storagePath: string): Promise<void> {
    const resolvedPath = await resolveMediaStoragePath(storagePath)
    await rm(resolvedPath, { force: true })
  }
}
