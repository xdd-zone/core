export { authApi, AuthRequestError } from './auth.api'
export {
  ensureAuthSession,
  getAuthMethodsQueryOptions,
  getAuthSessionQueryOptions,
  useAuthMethodsQuery,
  useLoginMutation,
  useLogoutMutation,
} from './auth.query'
export { useAuthStore } from './auth.store'
export type {
  ApiErrorResponse,
  AuthMethod,
  AuthMethodId,
  AuthMethodKind,
  AuthMethodsResponse,
  AuthSessionRecord,
  AuthUser,
  SessionPayload,
  SignInEmailBody,
} from './auth.types'
