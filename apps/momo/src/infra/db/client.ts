import { getMomoEnv } from '#momo/shared/env'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema/index'

type SqlClient = ReturnType<typeof postgres>
type DbClient = ReturnType<typeof drizzle<typeof schema>>

let sqlClient: SqlClient | undefined
let dbClient: DbClient | undefined

export function getDb(): DbClient {
  if (!sqlClient || !dbClient) {
    const env = getMomoEnv()

    sqlClient = postgres(env.DATABASE_URL)
    dbClient = drizzle(sqlClient, { schema })
  }

  return dbClient
}

export async function closeDb(): Promise<void> {
  if (!sqlClient) {
    return
  }

  await sqlClient.end()
  sqlClient = undefined
  dbClient = undefined
}
