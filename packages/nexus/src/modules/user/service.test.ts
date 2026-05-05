import type { UserBaseData } from './types'
import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import { UserRepository } from './repository'
import { UserService } from './service'

function createUser(overrides: Partial<UserBaseData> = {}): UserBaseData {
  return {
    id: 'user-1',
    username: 'user-one',
    name: '用户一',
    email: 'one@example.com',
    emailVerified: true,
    emailVerifiedAt: null,
    introduce: null,
    image: null,
    phone: '13800000001',
    phoneVerified: false,
    phoneVerifiedAt: null,
    lastLogin: null,
    lastLoginIp: null,
    status: 'ACTIVE',
    createdAt: new Date('2026-04-30T00:00:00.000Z'),
    updatedAt: new Date('2026-04-30T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  }
}

async function expectConflict(promise: Promise<unknown>, message: string) {
  try {
    await promise
  } catch (error) {
    expect(error).toMatchObject({
      status: 409,
      message,
    })
    return
  }

  throw new Error('预期抛出 409')
}

describe('UserService profile uniqueness', () => {
  afterEach(() => {
    spyOn(UserRepository, 'findById').mockRestore()
    spyOn(UserRepository, 'findDuplicateProfile').mockRestore()
    spyOn(UserRepository, 'updateProfile').mockRestore()
  })

  it('当前用户更新资料时重复邮箱应抛 409', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    spyOn(UserRepository, 'findDuplicateProfile').mockResolvedValue(
      createUser({
        id: 'user-2',
        email: 'same@example.com',
      }),
    )
    const updateSpy = spyOn(UserRepository, 'updateProfile').mockResolvedValue(createUser())

    await expectConflict(
      UserService.updateProfile('user-1', {
        email: 'same@example.com',
      }),
      '邮箱已被其他用户使用',
    )
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('当前用户更新资料时重复用户名应抛 409', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    spyOn(UserRepository, 'findDuplicateProfile').mockResolvedValue(
      createUser({
        id: 'user-2',
        username: 'same-name',
      }),
    )
    const updateSpy = spyOn(UserRepository, 'updateProfile').mockResolvedValue(createUser())

    await expectConflict(
      UserService.updateProfile('user-1', {
        username: 'same-name',
      }),
      '用户名已被其他用户使用',
    )
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('当前用户更新资料时重复手机号应抛 409', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    spyOn(UserRepository, 'findDuplicateProfile').mockResolvedValue(
      createUser({
        id: 'user-2',
        phone: '13800000002',
      }),
    )
    const updateSpy = spyOn(UserRepository, 'updateProfile').mockResolvedValue(createUser())

    await expectConflict(
      UserService.updateProfile('user-1', {
        phone: '13800000002',
      }),
      '手机号已被其他用户使用',
    )
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('管理员更新用户资料时重复邮箱应抛 409', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    spyOn(UserRepository, 'findDuplicateProfile').mockResolvedValue(
      createUser({
        id: 'user-2',
        email: 'same@example.com',
      }),
    )
    const updateSpy = spyOn(UserRepository, 'updateProfile').mockResolvedValue(createUser())

    await expectConflict(
      UserService.updateByAdmin('user-1', {
        email: 'same@example.com',
      }),
      '邮箱已被其他用户使用',
    )
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('管理员更新用户资料时重复用户名应抛 409', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    spyOn(UserRepository, 'findDuplicateProfile').mockResolvedValue(
      createUser({
        id: 'user-2',
        username: 'same-name',
      }),
    )
    const updateSpy = spyOn(UserRepository, 'updateProfile').mockResolvedValue(createUser())

    await expectConflict(
      UserService.updateByAdmin('user-1', {
        username: 'same-name',
      }),
      '用户名已被其他用户使用',
    )
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('管理员更新用户资料时重复手机号应抛 409', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    spyOn(UserRepository, 'findDuplicateProfile').mockResolvedValue(
      createUser({
        id: 'user-2',
        phone: '13800000002',
      }),
    )
    const updateSpy = spyOn(UserRepository, 'updateProfile').mockResolvedValue(createUser())

    await expectConflict(
      UserService.updateByAdmin('user-1', {
        phone: '13800000002',
      }),
      '手机号已被其他用户使用',
    )
    expect(updateSpy).not.toHaveBeenCalled()
  })
})
