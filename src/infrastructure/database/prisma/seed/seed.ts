import { PrismaPg } from '@prisma/adapter-pg'
import pino from 'pino'
import { PrismaClient } from '../generated/client'

// 从环境变量获取数据库连接字符串
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL 环境变量未设置')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// 独立的 logger，避免循环依赖
const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
})

async function main() {
  logger.info('🌱 开始执行数据库种子...')

  try {
    // Import seed functions
    const { seedRoles } = await import('./seeds/seed-roles')
    const { seedPermissions } = await import('./seeds/seed-permissions')
    const { seedRolePermissions } = await import('./seeds/seed-role-permissions')

    // 按顺序执行种子
    await seedRoles(prisma, logger)
    await seedPermissions(prisma, logger)
    await seedRolePermissions(prisma, logger)

    logger.info('🎉 数据库种子执行完成！')
  } catch (error) {
    logger.error(`❌ 种子执行失败: ${error}`)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    logger.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
