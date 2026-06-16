import type { AuthUserView } from '#momo/modules/auth/auth.types'

export interface HonoEnv {
  Bindings: Record<string, never>
  Variables: {
    requestId: string
    startedAt: number
    user?: AuthUserView
  }
}
