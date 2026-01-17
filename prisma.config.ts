import path from 'node:path'
import { defineConfig, env } from 'prisma/config'
import 'dotenv/config'

export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: path.join('src', 'infra', 'database', 'prisma', 'migrations'),
  },
  schema: path.join('src', 'infra', 'database', 'prisma', 'schema'),
})
