import type { UserBaseData } from './types'
import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { UserRepository } from './repository'
import { UserService } from './service'

const cryptoModule = await import('better-auth/crypto')

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

function createAccount() {
  return {
    id: 'account-1',
    createdAt: new Date('2026-04-30T00:00:00.000Z'),
    updatedAt: new Date('2026-04-30T00:00:00.000Z'),
    userId: 'user-1',
    scope: null,
    password: 'new-hash',
    accountId: 'user-1',
    providerId: 'credential',
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
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
    spyOn(UserRepository, 'paginate').mockRestore()
    spyOn(UserRepository, 'findById').mockRestore()
    spyOn(UserRepository, 'findDuplicateProfile').mockRestore()
    spyOn(UserRepository, 'findCredentialAccount').mockRestore()
    spyOn(UserRepository, 'updateProfile').mockRestore()
    spyOn(UserRepository, 'updateStatus').mockRestore()
    spyOn(UserRepository, 'upsertCredentialPassword').mockRestore()
    spyOn(UserRepository, 'deleteOtherSessions').mockRestore()
    spyOn(cryptoModule, 'hashPassword').mockRestore()
    spyOn(cryptoModule, 'verifyPassword').mockRestore()
  })

  it('列表查询应传入状态和关键字条件', async () => {
    const paginateSpy = spyOn(UserRepository, 'paginate').mockResolvedValue({
      items: [createUser()],
      total: 1,
      page: 2,
      pageSize: 10,
      totalPages: 1,
    })

    const result = await UserService.list({
      page: 2,
      pageSize: 10,
      status: 'ACTIVE',
      keyword: 'one',
    })

    expect(paginateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ACTIVE',
      }),
      {
        page: 2,
        pageSize: 10,
        status: 'ACTIVE',
        keyword: 'one',
      },
    )
    expect(Array.isArray(paginateSpy.mock.calls[0]?.[0].OR)).toBe(true)
    expect(result.items[0]?.id).toBe('user-1')
  })

  it('查询不存在用户应抛 404', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(null)

    await expect(UserService.findById('missing')).rejects.toMatchObject({
      status: 404,
      message: '用户不存在',
    })
  })

  it('当前用户更新资料成功时应写入仓储', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    spyOn(UserRepository, 'findDuplicateProfile').mockResolvedValue(null)
    const updateSpy = spyOn(UserRepository, 'updateProfile').mockResolvedValue(
      createUser({
        name: '用户一更新',
        introduce: '新的简介',
      }),
    )

    const result = await UserService.updateProfile('user-1', {
      name: '用户一更新',
      introduce: '新的简介',
    })

    expect(updateSpy).toHaveBeenCalledWith('user-1', {
      username: undefined,
      name: '用户一更新',
      email: undefined,
      phone: undefined,
      introduce: '新的简介',
      image: undefined,
    })
    expect(result.name).toBe('用户一更新')
  })

  it('管理员更新用户状态成功时应返回新状态', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    const updateSpy = spyOn(UserRepository, 'updateStatus').mockResolvedValue(
      createUser({
        status: 'INACTIVE',
      }),
    )

    const result = await UserService.updateStatus('user-1', 'INACTIVE')

    expect(updateSpy).toHaveBeenCalledWith('user-1', 'INACTIVE')
    expect(result.status).toBe('INACTIVE')
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

  it('更新密码时已有密码但未传当前密码应抛 400', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    spyOn(UserRepository, 'findCredentialAccount').mockResolvedValue({
      id: 'account-1',
      password: 'hashed-password',
    } as never)
    const verifySpy = spyOn(cryptoModule, 'verifyPassword').mockImplementation(mock(async () => true))
    const upsertSpy = spyOn(UserRepository, 'upsertCredentialPassword').mockResolvedValue(createAccount())

    await expect(
      UserService.updatePassword('user-1', 'session-1', {
        newPassword: 'new-password-123',
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: '请输入当前密码',
      code: 'CURRENT_PASSWORD_REQUIRED',
    })

    expect(verifySpy).not.toHaveBeenCalled()
    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it('更新密码时当前密码错误应抛 400', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    spyOn(UserRepository, 'findCredentialAccount').mockResolvedValue({
      id: 'account-1',
      password: 'hashed-password',
    } as never)
    const verifySpy = spyOn(cryptoModule, 'verifyPassword').mockImplementation(mock(async () => false))
    const upsertSpy = spyOn(UserRepository, 'upsertCredentialPassword').mockResolvedValue(createAccount())

    await expect(
      UserService.updatePassword('user-1', 'session-1', {
        currentPassword: 'wrong-password',
        newPassword: 'new-password-123',
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: '当前密码不正确',
      code: 'INVALID_CURRENT_PASSWORD',
    })

    expect(verifySpy).toHaveBeenCalledWith({
      hash: 'hashed-password',
      password: 'wrong-password',
    })
    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it('更新密码成功后应写入新密码并清理其他会话', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    spyOn(UserRepository, 'findCredentialAccount').mockResolvedValue({
      id: 'account-1',
      password: 'hashed-password',
    } as never)
    const verifySpy = spyOn(cryptoModule, 'verifyPassword').mockImplementation(mock(async () => true))
    const hashSpy = spyOn(cryptoModule, 'hashPassword').mockImplementation(mock(async () => 'new-hash'))
    const upsertSpy = spyOn(UserRepository, 'upsertCredentialPassword').mockResolvedValue(createAccount())
    const deleteSessionsSpy = spyOn(UserRepository, 'deleteOtherSessions').mockResolvedValue(undefined)

    const result = await UserService.updatePassword('user-1', 'session-1', {
      currentPassword: 'current-password',
      newPassword: 'new-password-123',
    })

    expect(verifySpy).toHaveBeenCalledWith({
      hash: 'hashed-password',
      password: 'current-password',
    })
    expect(hashSpy).toHaveBeenCalledWith('new-password-123')
    expect(upsertSpy).toHaveBeenCalledWith('user-1', 'new-hash')
    expect(deleteSessionsSpy).toHaveBeenCalledWith('user-1', 'session-1')
    expect(result).toEqual({
      hasPassword: true,
    })
  })

  it('首次设置密码时不校验当前密码', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    spyOn(UserRepository, 'findCredentialAccount').mockResolvedValue(null)
    const verifySpy = spyOn(cryptoModule, 'verifyPassword').mockImplementation(mock(async () => true))
    const hashSpy = spyOn(cryptoModule, 'hashPassword').mockImplementation(mock(async () => 'new-hash'))
    const upsertSpy = spyOn(UserRepository, 'upsertCredentialPassword').mockResolvedValue(createAccount())
    const deleteSessionsSpy = spyOn(UserRepository, 'deleteOtherSessions').mockResolvedValue(undefined)

    const result = await UserService.updatePassword('user-1', 'session-1', {
      newPassword: 'new-password-123',
    })

    expect(verifySpy).not.toHaveBeenCalled()
    expect(hashSpy).toHaveBeenCalledWith('new-password-123')
    expect(upsertSpy).toHaveBeenCalledWith('user-1', 'new-hash')
    expect(deleteSessionsSpy).toHaveBeenCalledWith('user-1', 'session-1')
    expect(result).toEqual({
      hasPassword: true,
    })
  })
})
