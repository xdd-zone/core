import type { AuthApiSession, SignInEmailPayload, SignUpEmailPayload } from './auth-api.types'
import { clearBetterAuthCookies, forwardBetterAuthResponse, revokeBetterAuthSession } from './better-auth.adapter'

type ResponseHeaders = Headers | Record<string, string | number | string[]>

/**
 * 认证接口动作服务。
 */
export class AuthApiService {
  /**
   * 邮箱注册。
   */
  static async signUpEmail(
    request: Request,
    body: SignUpEmailPayload,
    headers: ResponseHeaders,
  ): Promise<AuthApiSession> {
    return await forwardBetterAuthResponse<AuthApiSession>(request, {
      body,
      headers,
    })
  }

  /**
   * 邮箱登录。
   */
  static async signInEmail(
    request: Request,
    body: SignInEmailPayload,
    headers: ResponseHeaders,
  ): Promise<AuthApiSession> {
    return await forwardBetterAuthResponse<AuthApiSession>(request, {
      body,
      headers,
    })
  }

  /**
   * 登出当前会话。
   */
  static async signOut(request: Request, headers: ResponseHeaders): Promise<void> {
    await revokeBetterAuthSession(request)
    clearBetterAuthCookies(headers)
  }
}
