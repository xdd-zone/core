import type { SessionPayload, SignInEmailBody } from './auth.types'

import { api, ConsoleApiError, unwrapEdenResponse } from '@console/shared/api'

export { ConsoleApiError as AuthRequestError }

const authApiRoot = api.auth

/**
 * 认证 API。
 */
export const authApi = {
  async getSession(): Promise<SessionPayload> {
    return unwrapEdenResponse(await authApiRoot['get-session'].get())
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
