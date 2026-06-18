import type { MomoLogger } from '#momo/infra/logger'
import type { MomoEnv } from '#momo/shared/env'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { createChildLogger, createLogger } from '#momo/infra/logger'
import { getMomoEnv } from '#momo/shared/env'

import * as schema from './schema/index'

type SqlClient = ReturnType<typeof postgres>
export type DbClient = ReturnType<typeof drizzle<typeof schema>>

let sqlClient: SqlClient | undefined
let dbClient: DbClient | undefined
let runtimeEnv: MomoEnv | undefined
let runtimeLogger: MomoLogger | undefined

export function configureDbClient(options: { env: MomoEnv; logger: MomoLogger }): void {
  runtimeEnv = options.env
  runtimeLogger = options.logger
}

export function getDb(): DbClient {
  if (!sqlClient || !dbClient) {
    const { env, logger: pgLogger } = getDbRuntime()

    sqlClient = postgres(env.DATABASE_URL, {
      // 监听数据库通知（比如警告等）
      onnotice: (notice) => {
        pgLogger.warn(notice, 'Notice from Postgres')
      },
      // 监听连接关闭
      onclose: (connId) => {
        pgLogger.debug({ connId }, `Connection ${connId} closed`)
      },
      // 驱动层调试日志：包含连接 ID 等底层信息
      debug:
        env.APP_ENV === 'development' && env.LOG_SQL
          ? (connection, query, params) => {
              pgLogger.debug({ connection, paramsCount: params.length }, query)
            }
          : false,
    })

    dbClient = drizzle(sqlClient, {
      schema,
    })
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

function getDbRuntime(): { env: MomoEnv; logger: MomoLogger } {
  if (runtimeEnv && runtimeLogger) {
    return {
      env: runtimeEnv,
      logger: runtimeLogger,
    }
  }

  const env = getMomoEnv()
  const baseLogger = createLogger(env)

  return {
    env,
    logger: createChildLogger(baseLogger, 'db'),
  }
}
