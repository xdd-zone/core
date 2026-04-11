import { createConfig } from './load-config'

export const CONFIG = createConfig()

export type { AuthMethodId, AuthMethodKind, AuthMethodPolicy, DeepPartial, LogLevel, ResolvedConfig } from './types'
export { createConfig }
