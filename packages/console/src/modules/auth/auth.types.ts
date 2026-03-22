export interface AuthSessionRecord {
  createdAt: string
  expiresAt: string
  id: string
  ipAddress: string | null
  token: string
  userAgent: string | null
  userId: string
}

export interface AuthUser {
  createdAt: string
  email?: string | null
  id: string
  image?: string | null
  name: string
  phone?: string | null
  status?: string | null
  updatedAt: string
  username?: string | null
}

export interface SessionPayload {
  isAuthenticated: boolean
  session: AuthSessionRecord | null
  user: AuthUser | null
}

export interface SignInEmailBody {
  email: string
  password: string
  rememberMe?: boolean
}

export interface ApiErrorResponse {
  code?: number
  data?: null
  details?: unknown
  errorCode?: string
  message?: string
}
