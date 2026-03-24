import type { ApiErrorResponse, SessionPayload, SignInEmailBody } from './auth.types'

import { api, ConsoleApiError, unwrapEdenResponse } from '@console/shared/api'

export { ConsoleApiError as AuthRequestError }

interface AuthClient {
  'get-session': {
    get: () => Promise<{
      data: SessionPayload | null
      error: {
        status: number
        value: ApiErrorResponse
      } | null
      response: Response
      status: number
    }>
  }
  'sign-in': {
    email: {
      post: (body: SignInEmailBody) => Promise<{
        data: unknown
        error: {
          status: number
          value: ApiErrorResponse
        } | null
        response: Response
        status: number
      }>
    }
  }
  'sign-out': {
    post: () => Promise<{
      data: void | null
      error: {
        status: number
        value: ApiErrorResponse
      } | null
      response: Response
      status: number
    }>
  }
  me: {
    get: () => Promise<{
      data: SessionPayload | null
      error: {
        status: number
        value: ApiErrorResponse
      } | null
      response: Response
      status: number
    }>
  }
}

const authClient = (api.auth ?? {}) as AuthClient

/**
 * 认证 API。
 */
export const authApi = {
  async getSession(): Promise<SessionPayload> {
    return unwrapEdenResponse(await authClient['get-session'].get())
  },

  async signIn(body: SignInEmailBody): Promise<void> {
    await unwrapEdenResponse(await authClient['sign-in'].email.post(body))
  },

  async signOut(): Promise<void> {
    await unwrapEdenResponse(await authClient['sign-out'].post())
  },

  async getMe(): Promise<SessionPayload> {
    return unwrapEdenResponse(await authClient.me.get())
  },
}
