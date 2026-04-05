export { AuthApiService } from './auth-api.service'
export type {
  AuthApiSession,
  AuthApiSessionRecord,
  AuthApiUser,
  SignInEmailPayload,
  SignUpEmailPayload,
} from './auth-api.types'
export { AuthMethodsService } from './auth-methods.service'
export type { PublicAuthMethod } from './auth-methods.service'
export { betterAuthInstance } from './better-auth'
export * from './better-auth.adapter'
export * from './hooks'
export type { AuthenticatedSecuritySession, SecurityContext, SecuritySession } from './security.types'
export { SessionService } from './session.service'
