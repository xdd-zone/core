export { createAuthApiService } from './auth-api.service'
export type { AuthApiService } from './auth-api.service'
export type {
  AuthApiSession,
  AuthApiSessionRecord,
  AuthApiUser,
  SignInEmailPayload,
  SignUpEmailPayload,
} from './auth-api.types'
export { createAuthMethodsService } from './auth-methods.service'
export type { AuthMethodsService, PublicAuthMethod } from './auth-methods.service'
export { createBetterAuthInstance } from './better-auth'
export type { BetterAuthInstance } from './better-auth'
export { createBetterAuthAdapter } from './better-auth.adapter'
export type { BetterAuthAdapter } from './better-auth.adapter'
export * from './hooks'
export type { AuthenticatedSecuritySession, SecurityContext, SecuritySession } from './security.types'
export { createSessionService } from './session.service'
export type { SessionService } from './session.service'
