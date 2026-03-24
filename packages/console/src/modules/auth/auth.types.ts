export type {
  AuthSessionRecord,
  AuthUser,
  Session as SessionPayload,
  SignInEmailBody,
} from '@xdd-zone/nexus/auth-types'

export interface ApiErrorResponse {
  code?: number
  data?: null
  details?: unknown
  errorCode?: string
  message?: string
}
