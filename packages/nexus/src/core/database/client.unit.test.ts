import type { Logger } from '../../infra/logger'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

type PrismaLogLevel = 'query' | 'error' | 'info' | 'warn'

interface MockPrismaConstructorInput {
  adapter?: unknown
  log?: Array<{ emit: 'event'; level: PrismaLogLevel }>
}

interface MockPrismaEvent {
  message?: string
  query?: string
  params?: string
  duration?: number
  target: string
}

const prismaConstructorInputs: MockPrismaConstructorInput[] = []
const adapterConstructorInputs: unknown[] = []
const prismaInstances: MockPrismaClient[] = []

function lastItem<T>(items: readonly T[]): T | undefined {
  return items[items.length - 1]
}

class MockPrismaClient {
  readonly eventListeners = new Map<PrismaLogLevel, (event: MockPrismaEvent) => void>()
  readonly $connect = mock(() => Promise.resolve())
  readonly $disconnect = mock(() => Promise.resolve())
  readonly $queryRaw = mock(() => Promise.resolve([]))

  constructor(input: MockPrismaConstructorInput = {}) {
    prismaConstructorInputs.push(input)
    prismaInstances.push(this)
  }

  $on(eventType: PrismaLogLevel, callback: (event: MockPrismaEvent) => void) {
    this.eventListeners.set(eventType, callback)
  }
}

class MockPrismaPg {
  constructor(input: unknown) {
    adapterConstructorInputs.push(input)
  }
}

async function importDatabaseClient() {
  mock.module('@nexus-prisma/generated/client', () => ({
    PrismaClient: MockPrismaClient,
  }))

  mock.module('@prisma/adapter-pg', () => ({
    PrismaPg: MockPrismaPg,
  }))

  return await import(`../../infra/database/client?test=${Date.now()}-${Math.random()}`)
}

function createDatabaseConfig(log: Record<PrismaLogLevel, boolean>) {
  return {
    database: {
      url: 'postgresql://user:pass@localhost:5432/xdd',
      log,
    },
  }
}

function createMockLogger() {
  const calls = {
    childContexts: [] as Array<Record<string, unknown>>,
    debug: [] as Array<[unknown, string]>,
    error: [] as Array<[unknown, string]>,
    info: [] as Array<[unknown, string]>,
    warn: [] as Array<[unknown, string]>,
  }

  const childLogger = {
    debug(payload: unknown, message: string) {
      calls.debug.push([payload, message])
    },
    error(payload: unknown, message: string) {
      calls.error.push([payload, message])
    },
    info(payload: unknown, message: string) {
      calls.info.push([payload, message])
    },
    warn(payload: unknown, message: string) {
      calls.warn.push([payload, message])
    },
  }

  const baseLogger = {
    child(context: Record<string, unknown>) {
      calls.childContexts.push(context)
      return childLogger
    },
  } as unknown as Logger

  return {
    baseLogger,
    calls,
  }
}

beforeEach(() => {
  prismaConstructorInputs.length = 0
  adapterConstructorInputs.length = 0
  prismaInstances.length = 0
})

afterEach(() => {
  mock.restore()
})

describe('database client', () => {
  it('导出 Prisma 单例实例并具备基础就绪方法', async () => {
    const { prisma } = await importDatabaseClient()

    expect(prisma).toBeDefined()
    expect(typeof prisma.$connect).toBe('function')
    expect(typeof prisma.$disconnect).toBe('function')
    expect(typeof prisma.$queryRaw).toBe('function')
  })

  it('createPrismaClient 应按配置创建新实例并传入 adapter 和 log', async () => {
    const { createPrismaClient, prisma } = await importDatabaseClient()
    const client = createPrismaClient(
      createDatabaseConfig({
        query: true,
        error: true,
        info: false,
        warn: true,
      }),
    )

    expect(client).not.toBe(prisma)
    expect(typeof client.$connect).toBe('function')
    expect(typeof client.$disconnect).toBe('function')
    expect(typeof client.$queryRaw).toBe('function')
    expect(lastItem(adapterConstructorInputs)).toEqual({
      connectionString: 'postgresql://user:pass@localhost:5432/xdd',
    })
    expect(lastItem(prismaConstructorInputs)).toMatchObject({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    })
  })

  it('启用数据库日志时应注册对应事件监听并写入模块日志', async () => {
    const { createPrismaClient } = await importDatabaseClient()
    const { baseLogger, calls } = createMockLogger()
    const client = createPrismaClient(
      createDatabaseConfig({
        query: true,
        error: true,
        info: true,
        warn: true,
      }),
      baseLogger,
    ) as unknown as MockPrismaClient

    expect(calls.childContexts).toEqual([{ module: 'prisma' }])
    expect([...client.eventListeners.keys()].sort()).toEqual(['error', 'info', 'query', 'warn'])

    client.eventListeners.get('query')?.({
      query: 'select 1',
      params: '[]',
      duration: 3,
      target: 'db',
    })
    client.eventListeners.get('warn')?.({
      message: 'slow query',
      target: 'db',
    })
    client.eventListeners.get('info')?.({
      message: 'connected',
      target: 'db',
    })
    client.eventListeners.get('error')?.({
      message: 'failed',
      target: 'db',
    })

    expect(calls.debug).toEqual([
      [
        {
          query: 'select 1',
          params: '[]',
          duration: 3,
          target: 'db',
        },
        'query',
      ],
    ])
    expect(calls.warn).toEqual([[{ message: 'slow query', target: 'db' }, 'warn']])
    expect(calls.info).toEqual([[{ message: 'connected', target: 'db' }, 'info']])
    expect(calls.error).toEqual([[{ message: 'failed', target: 'db' }, 'error']])
  })

  it('关闭数据库日志时不注册事件监听', async () => {
    const { createPrismaClient } = await importDatabaseClient()
    const client = createPrismaClient(
      createDatabaseConfig({
        query: false,
        error: false,
        info: false,
        warn: false,
      }),
    ) as unknown as MockPrismaClient

    expect(lastItem(prismaConstructorInputs)?.log).toEqual([])
    expect(client.eventListeners.size).toBe(0)
  })
})
