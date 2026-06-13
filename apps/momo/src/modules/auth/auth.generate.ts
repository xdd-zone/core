import { createRuntime } from '#momo/bootstrap'

import { createMomoAuth } from './auth.config'

export const auth = createMomoAuth(createRuntime())

export default auth
