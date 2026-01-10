import path from 'node:path'
import { config } from 'dotenv'
import { defineConfig, env } from 'prisma/config'

// Load .env file explicitly
config()

export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: path.join(
      'src',
      'infrastructure',
      'database',
      'prisma',
      'migrations',
    ),
  },
  schema: path.join('src', 'infrastructure', 'database', 'prisma', 'schema'),
})
