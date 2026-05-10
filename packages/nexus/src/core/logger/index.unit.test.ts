import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'

import { createLogger, createModuleLogger } from '../../infra/logger'

const testLogDirs = new Set<string>()

function createLogFilePath() {
  const dir = join(tmpdir(), `xdd-nexus-logger-test-${crypto.randomUUID()}`)
  mkdirSync(dir, { recursive: true })
  testLogDirs.add(dir)

  return join(dir, 'nexus.log')
}

function createLoggerConfig(filePath: string) {
  return {
    logger: {
      level: 'debug' as const,
      pretty: false,
      filePath,
      serviceName: 'nexus-test-service',
    },
  }
}

function createTestLogger() {
  const filePath = createLogFilePath()
  const logger = createLogger(createLoggerConfig(filePath))

  return { filePath, logger }
}

async function readLogFile(filePath: string) {
  const deadline = Date.now() + 2_000

  while (Date.now() < deadline) {
    if (existsSync(filePath)) {
      const output = readFileSync(filePath, 'utf8')
      if (output.length > 0) {
        return output
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 20))
  }

  expect(existsSync(filePath)).toBe(true)
  return readFileSync(filePath, 'utf8')
}

afterEach(() => {
  for (const dir of testLogDirs) {
    rmSync(dir, { force: true, recursive: true })
  }

  testLogDirs.clear()
})

describe('logger', () => {
  it('logger.info 输出 JSON 日志并注入环境标识', async () => {
    const { filePath, logger } = createTestLogger()
    logger.info({ requestId: 'request-1' }, 'info message')

    const output = await readLogFile(filePath)
    expect(output).toContain('info message')
    expect(output).toContain('request-1')
    expect(output).toContain('nexus-test-service')
  })

  it('logger.error 输出错误日志', async () => {
    const { filePath, logger } = createTestLogger()
    logger.error({ error: new Error('boom') }, 'error message')

    const output = await readLogFile(filePath)
    expect(output).toContain('error message')
    expect(output).toContain('boom')
    expect(output).toContain('error')
  })

  it('createModuleLogger 注入模块和额外上下文', async () => {
    const { filePath, logger } = createTestLogger()
    const moduleLogger = createModuleLogger('database', { worker: 'test' }, logger)
    moduleLogger.info('module message')

    const output = await readLogFile(filePath)
    expect(output).toContain('module message')
    expect(output).toContain('database')
    expect(output).toContain('test')
    expect(output).toContain('nexus-test-service')
  })
})
