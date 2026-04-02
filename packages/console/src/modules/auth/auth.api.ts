import type { AuthMethodsResponse, SessionPayload, SignInEmailBody } from './auth.types'

import { api, ConsoleApiError, resolveApiUrl, unwrapEdenResponse } from '@console/shared/api'

export { ConsoleApiError as AuthRequestError }

const authApiRoot = api.auth

/**
 * 认证 API。
 */
export const authApi = {
  /**
   * 构造 GitHub 登录地址。
   */
  getGithubSignInUrl(callbackURL: string): string {
    const url = new URL(resolveApiUrl('/auth/sign-in/github'))
    url.searchParams.set('callbackURL', callbackURL)
    return url.toString()
  },

  async getSession(): Promise<SessionPayload> {
    return unwrapEdenResponse(await authApiRoot['get-session'].get())
  },

  async getMethods(): Promise<AuthMethodsResponse> {
    return unwrapEdenResponse(await authApiRoot.methods.get())
  },

  async signIn(body: SignInEmailBody): Promise<void> {
    await unwrapEdenResponse(await authApiRoot['sign-in'].email.post(body))
  },

  async signOut(): Promise<void> {
    await unwrapEdenResponse(await authApiRoot['sign-out'].post())
  },

  async getMe(): Promise<SessionPayload> {
    return unwrapEdenResponse(await authApiRoot.me.get())
  },
}
