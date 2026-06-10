export interface HonoEnv {
  Bindings: Record<string, never>
  Variables: {
    requestId: string
    startedAt: number
    user?: {
      id: string
      role: string
    }
  }
}
