import { createMomoApp, createRuntime } from '#momo/bootstrap'

const runtime = createRuntime()
const app = createMomoApp(runtime)

export { app }

export default app
