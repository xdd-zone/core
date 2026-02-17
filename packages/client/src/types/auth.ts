import type { UserStatus, SignUpEmailBody, SignInEmailBody } from '@xdd-zone/schema/auth'
import type { UserBase, Session, SessionData, AuthSessionData } from '@xdd-zone/schema/auth'

export type { UserStatus, SignUpEmailBody, SignInEmailBody }
export type { UserBase, Session, SessionData, AuthSessionData }

export interface AuthResponse {
  code: number
  message: string
  data: AuthSessionData
}

export interface SessionResponse {
  code: number
  message: string
  data: SessionData
}

export type GetSessionResponse = SessionResponse

export interface SignOutResponse {
  code: number
  message: string
  data: null
}
