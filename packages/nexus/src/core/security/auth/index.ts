export { AuthApiService } from './auth-api.service'
export type { AuthApiSession, AuthApiSessionRecord, AuthApiUser, SignInEmailPayload, SignUpEmailPayload } from './auth-api.types'
export { betterAuthInstance } from './better-auth'
export * from './better-auth.adapter'
export * from './hooks'
export type {
  AuthenticatedSecuritySession,
  SecurityContext,
  SecuritySession,
} from './security.types'
export { SessionService } from './session.service'
