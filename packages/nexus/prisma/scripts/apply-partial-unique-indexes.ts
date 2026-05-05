#!/usr/bin/env bun

import { resolve } from 'node:path'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
import { PrismaClient } from '../generated'

config({
  override: true,
  path: resolve(import.meta.dir, '../../.env'),
})

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('缺少 DATABASE_URL，无法创建用户唯一索引')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
})

const statements = [
  `CREATE UNIQUE INDEX IF NOT EXISTS accounts_provider_id_account_id_key
   ON accounts (provider_id, account_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_email_active_unique
   ON users (email)
   WHERE deleted_at IS NULL AND email IS NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_username_active_unique
   ON users (username)
   WHERE deleted_at IS NULL AND username IS NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_phone_active_unique
   ON users (phone)
   WHERE deleted_at IS NULL AND phone IS NOT NULL`,
] as const

try {
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement)
  }

  console.log('账号和用户唯一索引已创建或已存在')
} finally {
  await prisma.$disconnect()
}
