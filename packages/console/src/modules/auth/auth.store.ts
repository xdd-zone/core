import type { AuthSessionRecord, AuthUser, SessionPayload } from './auth.types'

import { create } from 'zustand'

export interface AuthState {
  clearAuth: () => void
  isAuthenticated: boolean
  setSessionPayload: (payload: SessionPayload) => void
  session: AuthSessionRecord | null
  user: AuthUser | null
}

const EMPTY_AUTH_STATE: Pick<AuthState, 'isAuthenticated' | 'session' | 'user'> = {
  isAuthenticated: false,
  session: null,
  user: null,
}

function resolveSessionState(payload: SessionPayload): Pick<AuthState, 'isAuthenticated' | 'session' | 'user'> {
  return {
    isAuthenticated: payload.isAuthenticated,
    session: payload.session,
    user: payload.user,
  }
}

export const EMPTY_SESSION_PAYLOAD: SessionPayload = {
  isAuthenticated: false,
  session: null,
  user: null,
}

/**
 * 认证状态管理。
 */
export const useAuthStore = create<AuthState>()((set) => ({
  ...EMPTY_AUTH_STATE,
  clearAuth: () => {
    set(EMPTY_AUTH_STATE)
  },
  setSessionPayload: (payload) => {
    set(resolveSessionState(payload))
  },
  session: null,
  user: null,
}))

/**
 * 将服务端 session 数据同步到 auth store。
 */
export function applySessionPayload(payload: SessionPayload) {
  useAuthStore.getState().setSessionPayload(payload)
}

/**
 * 清空当前 auth store。
 */
export function clearAuthState() {
  useAuthStore.getState().clearAuth()
}
