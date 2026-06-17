import { FifaAuthMeError } from '@fifa/api/auth'
import { resolveFifaRouteAccess } from '@fifa/app/router/auth-guard'
import { BizCode } from '@xdd-zone/contracts'

const authMocks = vi.hoisted(() => ({
  getFifaAuthMe: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@fifa/api/auth', async () => {
  const actual = await vi.importActual<typeof import('@fifa/api/auth')>('@fifa/api/auth')

  return {
    ...actual,
    getFifaAuthMe: authMocks.getFifaAuthMe,
    signOut: authMocks.signOut,
  }
})

describe('fifa 路由权限判断', () => {
  afterEach(() => {
    authMocks.getFifaAuthMe.mockReset()
    authMocks.signOut.mockReset()
  })

  it('未登录时返回 login', async () => {
    authMocks.getFifaAuthMe.mockRejectedValue(new FifaAuthMeError(401, BizCode.AUTH_UNAUTHENTICATED, '当前请求未登录'))

    await expect(resolveFifaRouteAccess()).resolves.toEqual({ status: 'login' })
    expect(authMocks.signOut).not.toHaveBeenCalled()
  })

  it('无权限时会先退出登录再返回 forbidden', async () => {
    authMocks.getFifaAuthMe.mockRejectedValue(new FifaAuthMeError(403, BizCode.AUTH_FORBIDDEN, '当前账号没有操作权限'))
    authMocks.signOut.mockResolvedValue(undefined)

    await expect(resolveFifaRouteAccess()).resolves.toEqual({ status: 'forbidden' })
    expect(authMocks.signOut).toHaveBeenCalledTimes(1)
  })

  it('权限通过时返回 allowed', async () => {
    authMocks.getFifaAuthMe.mockResolvedValue({ user: { avatarUrl: null, displayName: 'Owner', id: 'user-id' } })

    await expect(resolveFifaRouteAccess()).resolves.toEqual({ status: 'allowed' })
    expect(authMocks.signOut).not.toHaveBeenCalled()
  })
})
