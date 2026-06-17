import { FifaAuthMeError, isFifaAuthForbiddenError, isFifaAuthUnauthenticatedError } from '@fifa/api/auth'
import { BizCode } from '@xdd-zone/contracts'

describe('fifa auth me error', () => {
  it('可以区分未登录和无权限', () => {
    const unauthenticatedError = new FifaAuthMeError(401, BizCode.AUTH_UNAUTHENTICATED, '当前请求未登录')
    const forbiddenError = new FifaAuthMeError(403, BizCode.AUTH_FORBIDDEN, '当前账号没有操作权限')

    expect(isFifaAuthUnauthenticatedError(unauthenticatedError)).toBe(true)
    expect(isFifaAuthForbiddenError(unauthenticatedError)).toBe(false)
    expect(isFifaAuthUnauthenticatedError(forbiddenError)).toBe(false)
    expect(isFifaAuthForbiddenError(forbiddenError)).toBe(true)
  })
})
