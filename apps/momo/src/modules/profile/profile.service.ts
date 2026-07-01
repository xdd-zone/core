import type {
  FifaProfileAccount,
  FifaProfileResponse,
  UpdateFifaProfileRequest,
  UploadFifaProfileAvatarResponse,
} from '@xdd-zone/contracts'
import type { MomoRuntime } from '#momo/bootstrap'
import type { ProfileRepository } from './profile.repository'
import { BizCode } from '@xdd-zone/contracts'
import { validateStoragePath } from '#momo/infra/storage/storage-path'
import { AppError } from '#momo/shared/app-error'

import { PROFILE_ACCOUNT_PROVIDERS } from './profile.repository'

const MAX_PROFILE_AVATAR_FILE_SIZE_BYTES = 2 * 1024 * 1024
const PROFILE_AVATAR_DIRECTORY = 'avatars'

export function createProfileService(runtime: MomoRuntime, repository: ProfileRepository) {
  async function getProfile(userId: string): Promise<FifaProfileResponse> {
    const profileUser = await repository.getUserById(userId)

    if (!profileUser) {
      throw new AppError(BizCode.AUTH_SESSION_INVALID, '当前登录用户不存在', 401)
    }

    const accountRows = await repository.listAccountsByUserId(userId)
    const accounts = PROFILE_ACCOUNT_PROVIDERS.map<FifaProfileAccount>((provider) => {
      const account = accountRows.find((row) => row.provider === provider)

      return {
        bound: Boolean(account),
        provider,
      }
    })

    return {
      ...profileUser,
      accounts,
    }
  }

  async function updateProfile(userId: string, input: UpdateFifaProfileRequest): Promise<FifaProfileResponse> {
    await repository.updateUserProfile(userId, input)
    return getProfile(userId)
  }

  async function uploadAvatar(userId: string, file: File): Promise<UploadFifaProfileAvatarResponse> {
    if (file.size > MAX_PROFILE_AVATAR_FILE_SIZE_BYTES) {
      throw new AppError(BizCode.COMMON_INVALID_REQUEST, '头像不能超过 2 MiB', 422)
    }

    const saved = await runtime.storage.save(file, { directory: PROFILE_AVATAR_DIRECTORY })

    const avatarUrl =
      saved.publicUrl ??
      `${runtime.env.BETTER_AUTH_URL.replace(/\/+$/, '')}/rpc/fifa/profile/avatar/${encodeStoragePathToken(saved.storagePath)}`
    const profileUser = await repository.getUserById(userId)

    if (!profileUser) {
      throw new AppError(BizCode.AUTH_SESSION_INVALID, '当前登录用户不存在', 401)
    }

    await repository.updateUserProfile(userId, {
      avatarUrl,
      displayName: profileUser.displayName,
    })

    return {
      avatarUrl,
    }
  }

  async function openAvatarFile(storagePathToken: string): Promise<Response> {
    const storagePath = decodeAvatarStoragePath(storagePathToken)
    const fileName = storagePath.split('/').at(-1) ?? storagePath
    return runtime.storage.openFile(storagePath, {
      mimeType: resolveImageMimeType(storagePath),
      originalName: fileName,
      size: (await runtime.storage.stat(storagePath)).size,
    })
  }

  return {
    getProfile,
    openAvatarFile,
    updateProfile,
    uploadAvatar,
  }
}

function decodeAvatarStoragePath(storagePathToken: string): string {
  let storagePath: string

  try {
    storagePath = Buffer.from(storagePathToken, 'base64url').toString('utf-8')
  } catch {
    throw new AppError(BizCode.COMMON_NOT_FOUND, '文件不存在', 404)
  }

  validateStoragePath(storagePath)

  if (!storagePath.split('/').includes(PROFILE_AVATAR_DIRECTORY)) {
    throw new AppError(BizCode.COMMON_NOT_FOUND, '文件不存在', 404)
  }

  return storagePath
}

function encodeStoragePathToken(storagePath: string): string {
  return Buffer.from(storagePath, 'utf-8').toString('base64url')
}

function resolveImageMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  const mimeTypes: Partial<Record<string, string>> = {
    avif: 'image/avif',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  }

  return extension ? (mimeTypes[extension] ?? 'application/octet-stream') : 'application/octet-stream'
}
