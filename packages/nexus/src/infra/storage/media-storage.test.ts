import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { NotFoundError } from '@nexus/core/http'
import { afterEach, describe, expect, it } from 'bun:test'

import { MediaStorage } from './media-storage'

const mediaDir = resolve(process.cwd(), 'storage/media')
const outsideFilePath = resolve(import.meta.dir, '../../../storage/media-storage-test-outside.txt')
const sourceModulePath = resolve(import.meta.dir, './media-storage.ts')
const httpModulePath = resolve(import.meta.dir, '../../core/http/index.ts')
const createdStoragePaths = new Set<string>()
const tempPaths = new Set<string>()

async function cleanupPath(filePath: string) {
  await rm(filePath, { force: true, recursive: true }).catch(() => undefined)
}

async function loadStorageModuleFromBuildLikeDir() {
  const tempRoot = await mkdtemp(join(tmpdir(), 'media-storage-dist-'))
  const tempModulePath = join(tempRoot, 'dist/infra/storage/media-storage.ts')
  const source = await readFile(sourceModulePath, 'utf8')
  const rewrittenSource = source.replace("from '@nexus/core/http'", `from '${pathToFileURL(httpModulePath).href}'`)

  tempPaths.add(tempRoot)
  await mkdir(dirname(tempModulePath), { recursive: true })
  await writeFile(tempModulePath, rewrittenSource)

  return (await import(`${pathToFileURL(tempModulePath).href}?t=${Date.now()}`)) as Promise<{
    MediaStorage: typeof MediaStorage
  }>
}

afterEach(async () => {
  for (const storagePath of createdStoragePaths) {
    await MediaStorage.remove(storagePath).catch(() => undefined)
  }

  for (const filePath of tempPaths) {
    await cleanupPath(filePath)
  }

  createdStoragePaths.clear()
  tempPaths.clear()
  await cleanupPath(outsideFilePath)
})

describe('MediaStorage', () => {
  it('保存文件时应使用固定的媒体目录', async () => {
    const { MediaStorage: buildStorage } = await loadStorageModuleFromBuildLikeDir()
    const file = new File(['hello media'], 'avatar.png', {
      type: 'image/png',
    })

    const result = await buildStorage.save(file)
    createdStoragePaths.add(result.storagePath)

    expect(result.fileName).toEndWith('.png')
    expect(result.storagePath).toBe(result.fileName)
    expect(await readFile(resolve(mediaDir, result.storagePath), 'utf8')).toBe('hello media')
  })

  it('读取和删除文件时应拒绝访问存储目录外的路径', async () => {
    await writeFile(outsideFilePath, 'outside media')

    await expect(MediaStorage.read(outsideFilePath)).rejects.toBeInstanceOf(NotFoundError)
    await expect(MediaStorage.remove(outsideFilePath)).rejects.toBeInstanceOf(NotFoundError)

    expect(await readFile(outsideFilePath, 'utf8')).toBe('outside media')
  })
})
