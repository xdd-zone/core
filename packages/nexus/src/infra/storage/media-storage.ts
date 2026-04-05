import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { NotFoundError } from '@nexus/core/http'

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

/**
 * 媒体文件本地存储。
 */
export class MediaStorage {
  /**
   * 保存上传文件，并返回本地存储信息。
   */
  static async save(file: File): Promise<{
    fileName: string
    storagePath: string
  }> {
    const mediaStorageDir = await resolveMediaStorageDir()
    await mkdir(mediaStorageDir, { recursive: true })

    const extension = extname(file.name)
    const fileName = `${crypto.randomUUID()}${extension}`
    const resolvedPath = join(mediaStorageDir, fileName)

    await writeFile(resolvedPath, new Uint8Array(await file.arrayBuffer()))

    return {
      fileName,
      storagePath: fileName,
    }
  }

  /**
   * 读取本地媒体文件。
   */
  static async read(storagePath: string): Promise<Uint8Array> {
    const resolvedPath = await resolveMediaStoragePath(storagePath)

    try {
      await access(resolvedPath)
    } catch {
      throw new NotFoundError('媒体文件不存在')
    }

    return await readFile(resolvedPath)
  }

  /**
   * 删除本地媒体文件。
   */
  static async remove(storagePath: string): Promise<void> {
    const resolvedPath = await resolveMediaStoragePath(storagePath)
    await rm(resolvedPath, { force: true })
  }
}
