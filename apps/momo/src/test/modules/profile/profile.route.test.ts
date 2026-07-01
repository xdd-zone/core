import type { ApiResponse, FifaProfileResponse, UploadFifaProfileAvatarResponse } from '@xdd-zone/contracts'
import type app from '#momo/app'
import { BizCode } from '@xdd-zone/contracts'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { closeDb, getDb } from '#momo/infra/db/client'
import { account } from '#momo/infra/db/schema/index'
import {
  bindFifaOwner,
  createCredentialUser,
  prepareAuthTestDatabase,
  resetAuthTestData,
  signInByEmail,
} from '#momo/test/helpers/auth-test-db'

const MAX_PROFILE_AVATAR_FILE_SIZE_BYTES = 2 * 1024 * 1024

let momoApp: typeof app

describe('profile 路由', () => {
  beforeAll(async () => {
    await prepareAuthTestDatabase()
    momoApp = (await import('#momo/app')).default
  })

  beforeEach(async () => {
    await resetAuthTestData()
  })

  afterAll(async () => {
    await closeDb()
  })

  it('未登录请求 profile 被拒绝', async () => {
    const response = await momoApp.request('/rpc/fifa/profile')
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(401)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_UNAUTHENTICATED)
  })

  it('非 owner 请求 profile 被拒绝', async () => {
    const testUser = await createCredentialUser({ email: 'profile-not-owner@example.com', name: 'Not Owner' })
    const cookie = await signInByEmail(momoApp, testUser.email)

    const response = await momoApp.request('/rpc/fifa/profile', {
      headers: {
        cookie,
      },
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(403)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_OWNER_REQUIRED)
  })

  it('owner 获取 profile 返回资料和登录方式', async () => {
    const testUser = await createCredentialUser({ email: 'profile-owner@example.com', name: 'Owner' })
    await bindFifaOwner(testUser.id)
    await getDb().insert(account).values({
      accountId: 'github-account-id',
      id: 'account_profile_owner_github',
      providerId: 'github',
      userId: testUser.id,
    })
    const cookie = await signInByEmail(momoApp, testUser.email)

    const response = await momoApp.request('/rpc/fifa/profile', {
      headers: {
        cookie,
      },
    })
    const body = (await response.json()) as ApiResponse<FifaProfileResponse>

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.ok && body.data).toMatchObject({
      avatarUrl: null,
      displayName: 'Owner',
      email: testUser.email,
      id: testUser.id,
    })
    expect(body.ok && body.data.accounts).toEqual([
      { bound: true, provider: 'credential' },
      { bound: true, provider: 'github' },
      { bound: false, provider: 'google' },
    ])
    expect(JSON.stringify(body)).not.toContain('accountId')
    expect(JSON.stringify(body)).not.toContain('password')
  })

  it('owner 修改资料后 auth/me 返回新资料', async () => {
    const testUser = await createCredentialUser({ email: 'profile-update@example.com', name: 'Old Name' })
    await bindFifaOwner(testUser.id)
    const cookie = await signInByEmail(momoApp, testUser.email)

    const updateResponse = await momoApp.request('/rpc/fifa/profile', {
      body: JSON.stringify({
        avatarUrl: '/rpc/fifa/profile/avatar/avatar.webp',
        displayName: 'New Name',
      }),
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      method: 'PATCH',
    })
    const authResponse = await momoApp.request('/rpc/fifa/auth/me', {
      headers: {
        cookie,
      },
    })
    const updateBody = (await updateResponse.json()) as ApiResponse<FifaProfileResponse>
    const authBody = (await authResponse.json()) as ApiResponse<{
      user: { avatarUrl: string | null; displayName: string; id: string }
    }>

    expect(updateResponse.status).toBe(200)
    expect(updateBody.ok).toBe(true)
    expect(authResponse.status).toBe(200)
    expect(authBody.ok).toBe(true)
    expect(authBody.ok && authBody.data.user).toEqual({
      avatarUrl: '/rpc/fifa/profile/avatar/avatar.webp',
      displayName: 'New Name',
      id: testUser.id,
    })
  })

  it('上传头像缺少文件时返回 400', async () => {
    const testUser = await createCredentialUser({ email: 'profile-avatar@example.com', name: 'Avatar Owner' })
    await bindFifaOwner(testUser.id)
    const cookie = await signInByEmail(momoApp, testUser.email)
    const form = new FormData()

    const response = await momoApp.request('/rpc/fifa/profile/avatar', {
      body: form,
      headers: {
        cookie,
      },
      method: 'POST',
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(400)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.COMMON_INVALID_REQUEST)
  })

  it('上传头像返回头像地址', async () => {
    const testUser = await createCredentialUser({ email: 'profile-avatar-upload@example.com', name: 'Avatar Owner' })
    await bindFifaOwner(testUser.id)
    const cookie = await signInByEmail(momoApp, testUser.email)
    const form = new FormData()

    form.append('file', new File([new Uint8Array([1, 2, 3])], 'avatar.png', { type: 'image/png' }))

    const response = await momoApp.request('/rpc/fifa/profile/avatar', {
      body: form,
      headers: {
        cookie,
      },
      method: 'POST',
    })
    const body = (await response.json()) as ApiResponse<UploadFifaProfileAvatarResponse>

    expect(response.status).toBe(201)
    expect(body.ok).toBe(true)
    expect(body.ok && body.data.avatarUrl).toMatch(/^http:\/\/localhost:7788\/rpc\/fifa\/profile\/avatar\/[\w-]+$/)

    const avatarUrl = body.ok ? body.data.avatarUrl : ''
    const avatarResponse = await momoApp.request(new URL(avatarUrl).pathname)
    const profileResponse = await momoApp.request('/rpc/fifa/profile', {
      headers: {
        cookie,
      },
    })
    const authResponse = await momoApp.request('/rpc/fifa/auth/me', {
      headers: {
        cookie,
      },
    })
    const profileBody = (await profileResponse.json()) as ApiResponse<FifaProfileResponse>
    const authBody = (await authResponse.json()) as ApiResponse<{
      user: { avatarUrl: string | null; displayName: string; id: string }
    }>

    expect(avatarResponse.status).toBe(200)
    expect(avatarResponse.headers.get('content-type')).toBe('image/png')
    expect(avatarResponse.headers.get('cross-origin-resource-policy')).toBe('cross-origin')
    await expect(avatarResponse.arrayBuffer()).resolves.toHaveProperty('byteLength', 3)
    expect(profileBody.ok && profileBody.data.avatarUrl).toBe(avatarUrl)
    expect(authBody.ok && authBody.data.user.avatarUrl).toBe(avatarUrl)
  })

  it('头像上传允许超过通用 rpc 1 MiB 限制', async () => {
    const testUser = await createCredentialUser({ email: 'profile-avatar-large@example.com', name: 'Avatar Owner' })
    await bindFifaOwner(testUser.id)
    const cookie = await signInByEmail(momoApp, testUser.email)
    const form = new FormData()

    form.append('file', new File([new Uint8Array(1024 * 1024 + 1)], 'avatar.png', { type: 'image/png' }))

    const response = await momoApp.request('/rpc/fifa/profile/avatar', {
      body: form,
      headers: {
        cookie,
      },
      method: 'POST',
    })
    const body = (await response.json()) as ApiResponse<UploadFifaProfileAvatarResponse>

    expect(response.status).toBe(201)
    expect(body.ok).toBe(true)
  })

  it('头像文件超过 2 MiB 时返回 422', async () => {
    const testUser = await createCredentialUser({ email: 'profile-avatar-too-large@example.com', name: 'Avatar Owner' })
    await bindFifaOwner(testUser.id)
    const cookie = await signInByEmail(momoApp, testUser.email)
    const form = new FormData()

    form.append(
      'file',
      new File([new Uint8Array(MAX_PROFILE_AVATAR_FILE_SIZE_BYTES + 1)], 'avatar.png', { type: 'image/png' }),
    )

    const response = await momoApp.request('/rpc/fifa/profile/avatar', {
      body: form,
      headers: {
        cookie,
      },
      method: 'POST',
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(422)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.COMMON_INVALID_REQUEST)
    expect(!body.ok && body.error.message).toBe('头像不能超过 2 MiB')
  })
})
