import type { AuthSessionRecord, AuthUser, SessionPayload, SignInEmailBody } from './auth.types'

import { create } from 'zustand'

import { authApi } from './auth.api'

export interface AuthState {
  bootstrapSession: () => Promise<void>
  clearAuth: () => void
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (payload: SignInEmailBody) => Promise<void>
  loginPending: boolean
  logout: () => Promise<void>
  session: AuthSessionRecord | null
  user: AuthUser | null
}

const EMPTY_AUTH_STATE: Pick<AuthState, 'isAuthenticated' | 'loginPending' | 'session' | 'user'> = {
  isAuthenticated: false,
  loginPending: false,
  session: null,
  user: null,
}

function resolveSessionState(payload: SessionPayload) {
  return {
    isAuthenticated: payload.isAuthenticated,
    session: payload.session,
    user: payload.user,
  }
}

/**
 * 认证状态管理。
 */
export const useAuthStore = create<AuthState>()((set) => ({
  ...EMPTY_AUTH_STATE,
  bootstrapSession: async () => {
    set({ isBootstrapping: true })

    try {
      const session = await authApi.getSession()
      set({
        ...resolveSessionState(session),
        isBootstrapping: false,
      })
    } catch {
      set({
        ...EMPTY_AUTH_STATE,
        isBootstrapping: false,
      })
    }
  },
  clearAuth: () => {
    set({
      ...EMPTY_AUTH_STATE,
      isBootstrapping: false,
    })
  },
  isBootstrapping: true,
  login: async (payload) => {
    set({ loginPending: true })

    try {
      await authApi.signIn(payload)
      const session = await authApi.getSession()

      set({
        ...resolveSessionState(session),
        isBootstrapping: false,
        loginPending: false,
      })
    } catch (error) {
      set({ loginPending: false })
      throw error
    }
  },
  logout: async () => {
    try {
      await authApi.signOut()
    } finally {
      set({
        ...EMPTY_AUTH_STATE,
        isBootstrapping: false,
      })
    }
  },
  session: null,
  user: null,
}))
