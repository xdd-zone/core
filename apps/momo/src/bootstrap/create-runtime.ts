import { getMomoEnv } from '#momo/shared/env'

export interface MomoRuntime {
  env: ReturnType<typeof getMomoEnv>
}

export function createRuntime(): MomoRuntime {
  return {
    env: getMomoEnv(),
  }
}
