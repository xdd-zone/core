import type { SystemLogEntry, SystemLogLevel } from '@xdd-zone/contracts'
import type { LogReader, LogReaderHealth, LogReaderResult, ResolvedSystemLogQuery } from './log-reader'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { truncateLogText } from '#momo/infra/logger'
import {
  LogReaderInvalidCursorError,
  LogReaderTimeoutError,
  LogReaderUnavailableError,
  PINO_LEVEL_VALUES,
} from './log-reader'

interface LokiLogReaderConfig {
  password?: string
  tenantId?: string
  timeoutMs: number
  url: string
  username?: string
}

interface CursorPayload {
  beforeNs: string
  excludeIds: string[]
  startNs: string
  toNs: string
}

interface NormalizedLogEntry {
  entry: SystemLogEntry
  timestampNs: string
}

type JsonValue = boolean | JsonValue[] | null | number | string | { [key: string]: JsonValue }

const LokiResponseSchema = z.object({
  data: z.object({
    result: z.array(
      z.object({
        stream: z.record(z.string(), z.string()),
        values: z.array(z.tuple([z.string().regex(/^\d+$/), z.string()])),
      }),
    ),
    resultType: z.literal('streams'),
  }),
  status: z.literal('success'),
})

const KNOWN_LOG_FIELDS = new Set([
  'causeCode',
  'causeMessage',
  'causeName',
  'durationMs',
  'env',
  'errorCode',
  'errorMessage',
  'errorName',
  'errorStack',
  'event',
  'hostname',
  'instance',
  'level',
  'method',
  'module',
  'msg',
  'path',
  'pid',
  'release',
  'requestId',
  'service',
  'status',
  'time',
])

const MAX_CONTEXT_ARRAY_LENGTH = 20
const MAX_CONTEXT_DEPTH = 4
const MAX_CONTEXT_KEYS = 50
const MAX_CONTEXT_STRING_LENGTH = 2000
const MAX_RAW_LINE_LENGTH = 4000

export class LokiLogReader implements LogReader {
  readonly enabled = true
  readonly provider = 'loki'

  constructor(
    private readonly config: LokiLogReaderConfig,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async health(): Promise<LogReaderHealth> {
    const response = await this.request(new URL('/ready', this.config.url))

    if (!response.ok) {
      throw new LogReaderUnavailableError('Loki readiness 检查失败')
    }

    return { status: 'ready' }
  }

  async query(input: ResolvedSystemLogQuery): Promise<LogReaderResult> {
    const cursor = decodeCursor(input.cursor)
    const startNs = cursor?.startNs ?? toNanoseconds(input.from)
    const toNs = cursor?.toNs ?? toNanoseconds(input.to)
    const beforeNs = cursor?.beforeNs ?? toNs
    const excludeIds = new Set(cursor?.excludeIds ?? [])
    const requestLimit = Math.min(5000, input.limit + excludeIds.size + 1)
    const url = new URL('/loki/api/v1/query_range', this.config.url)

    url.searchParams.set('direction', 'backward')
    url.searchParams.set('end', beforeNs)
    url.searchParams.set('limit', requestLimit.toString())
    url.searchParams.set('query', buildLokiQuery(input))
    url.searchParams.set('start', startNs)

    const response = await this.request(url)

    if (!response.ok) {
      throw new LogReaderUnavailableError('Loki 日志查询失败')
    }

    let payload: unknown

    try {
      payload = await response.json()
    } catch {
      throw new LogReaderUnavailableError('Loki 返回了无法解析的响应')
    }

    const parsed = LokiResponseSchema.safeParse(payload)

    if (!parsed.success) {
      throw new LogReaderUnavailableError('Loki 返回了不支持的响应格式')
    }

    const normalized = parsed.data.data.result
      .flatMap(({ stream, values }) => values.map(([timestampNs, line]) => normalizeLogEntry(timestampNs, line, stream)))
      .filter((item) => !excludeIds.has(item.entry.id))
      .sort((left, right) => compareNanoseconds(right.timestampNs, left.timestampNs))

    const page = normalized.slice(0, input.limit)
    const last = page.at(-1)
    const hasMore = normalized.length > input.limit

    return {
      from: fromNanoseconds(startNs),
      logs: page.map((item) => item.entry),
      nextCursor: hasMore && last ? createNextCursor(cursor, page, startNs, toNs, last.timestampNs) : null,
      to: fromNanoseconds(toNs),
    }
  }

  private async request(url: URL): Promise<Response> {
    try {
      return await this.fetcher(url, {
        headers: this.createHeaders(),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      })
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
        throw new LogReaderTimeoutError('Loki 请求超时')
      }

      throw new LogReaderUnavailableError('Loki 暂时不可用')
    }
  }

  private createHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      accept: 'application/json',
    }

    if (this.config.username && this.config.password) {
      headers.authorization = `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`
    }

    if (this.config.tenantId) {
      headers['x-scope-orgid'] = this.config.tenantId
    }

    return headers
  }
}

export function buildLokiQuery(input: ResolvedSystemLogQuery): string {
  const filters = [`{service="momo"}`, '| json', `| level >= ${PINO_LEVEL_VALUES[input.minLevel]}`]

  appendStringFilter(filters, 'module', input.module)
  appendStringFilter(filters, 'event', input.event)
  appendStringFilter(filters, 'requestId', input.requestId)
  appendStringFilter(filters, 'path', input.path)

  if (input.statusFrom !== undefined) {
    filters.push(`| status >= ${input.statusFrom}`)
  }

  if (input.statusTo !== undefined) {
    filters.push(`| status <= ${input.statusTo}`)
  }

  if (input.minDurationMs !== undefined) {
    filters.push(`| durationMs >= ${input.minDurationMs}`)
  }

  return filters.join(' ')
}

function appendStringFilter(filters: string[], field: string, value: string | undefined): void {
  if (value) {
    filters.push(`| ${field} = ${JSON.stringify(value)}`)
  }
}

function normalizeLogEntry(timestampNs: string, line: string, stream: Record<string, string>): NormalizedLogEntry {
  const parsedLine = parseLine(line)
  const fields = {
    ...stream,
    ...parsedLine,
  }
  const id = createHash('sha256').update(timestampNs).update('\0').update(line).digest('hex').slice(0, 16)

  return {
    entry: {
      context: createContext(fields),
      durationMs: readNonNegativeNumber(fields.durationMs),
      env: readString(fields.env),
      errorCode: readString(fields.errorCode),
      errorMessage: readString(fields.errorMessage),
      errorName: readString(fields.errorName),
      event: readString(fields.event),
      id,
      instance: readString(fields.instance),
      level: resolveLevel(fields.level),
      message: truncateLogText(readString(fields.msg) ?? readString(fields.message) ?? line, MAX_RAW_LINE_LENGTH),
      method: readString(fields.method),
      module: readString(fields.module),
      path: readString(fields.path),
      release: readString(fields.release),
      requestId: readString(fields.requestId),
      service: 'momo',
      status: readInteger(fields.status),
      timestamp: fromNanoseconds(timestampNs),
    },
    timestampNs,
  }
}

function parseLine(line: string): Record<string, unknown> {
  try {
    const value = JSON.parse(line) as unknown
    return isRecord(value) ? value : {}
  } catch {
    return {}
  }
}

function createContext(fields: Record<string, unknown>): Record<string, JsonValue> {
  const context: Record<string, JsonValue> = {}

  for (const [key, value] of Object.entries(fields)) {
    if (KNOWN_LOG_FIELDS.has(key)) continue

    const sanitized = sanitizeContextValue(key, value, 0)

    if (sanitized !== undefined) {
      context[key] = sanitized
    }

    if (Object.keys(context).length >= MAX_CONTEXT_KEYS) {
      context.truncated = '扩展字段过多，剩余内容已截断'
      break
    }
  }

  return context
}

function sanitizeContextValue(key: string, value: unknown, depth: number): JsonValue | undefined {
  if (isSensitiveKey(key)) return '[已隐藏]'
  if (depth >= MAX_CONTEXT_DEPTH) return '[内容过深]'
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return value
  if (typeof value === 'string') return truncateLogText(value, MAX_CONTEXT_STRING_LENGTH)

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_CONTEXT_ARRAY_LENGTH)
      .map((item) => sanitizeContextValue('', item, depth + 1))
      .filter((item): item is JsonValue => item !== undefined)
  }

  if (isRecord(value)) {
    const result: Record<string, JsonValue> = {}

    for (const [childKey, childValue] of Object.entries(value).slice(0, MAX_CONTEXT_KEYS)) {
      const sanitized = sanitizeContextValue(childKey, childValue, depth + 1)
      if (sanitized !== undefined) result[childKey] = sanitized
    }

    return result
  }

  return undefined
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.replaceAll(/[-_.]/g, '').toLowerCase()

  return (
    normalized.includes('authorization') ||
    normalized.includes('cookie') ||
    normalized.includes('password') ||
    normalized.includes('passwd') ||
    normalized.includes('secret') ||
    normalized.includes('apikey') ||
    normalized === 'token' ||
    normalized.endsWith('token')
  )
}

function resolveLevel(value: unknown): SystemLogLevel {
  if (typeof value === 'string') {
    if (value === 'trace' || value === 'debug' || value === 'info' || value === 'warn' || value === 'error' || value === 'fatal') {
      return value
    }

    const numeric = Number(value)
    if (Number.isFinite(numeric)) return resolveNumericLevel(numeric)
  }

  return typeof value === 'number' ? resolveNumericLevel(value) : 'info'
}

function resolveNumericLevel(value: number): SystemLogLevel {
  if (value >= 60) return 'fatal'
  if (value >= 50) return 'error'
  if (value >= 40) return 'warn'
  if (value >= 30) return 'info'
  if (value >= 20) return 'debug'
  return 'trace'
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? truncateLogText(value) : null
}

function readInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null
}

function readNonNegativeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function createNextCursor(
  cursor: CursorPayload | undefined,
  page: NormalizedLogEntry[],
  startNs: string,
  toNs: string,
  boundaryNs: string,
): string {
  const previousIds = cursor?.beforeNs === boundaryNs ? cursor.excludeIds : []
  const boundaryIds = page.filter((item) => item.timestampNs === boundaryNs).map((item) => item.entry.id)
  const payload: CursorPayload = {
    beforeNs: boundaryNs,
    excludeIds: [...new Set([...previousIds, ...boundaryIds])],
    startNs,
    toNs,
  }

  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodeCursor(cursor: string | undefined): CursorPayload | undefined {
  if (!cursor) return undefined

  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown

    if (
      !isRecord(value) ||
      typeof value.beforeNs !== 'string' ||
      typeof value.startNs !== 'string' ||
      typeof value.toNs !== 'string' ||
      !/^\d+$/.test(value.beforeNs) ||
      !/^\d+$/.test(value.startNs) ||
      !/^\d+$/.test(value.toNs) ||
      !Array.isArray(value.excludeIds) ||
      !value.excludeIds.every((item) => typeof item === 'string')
    ) {
      throw new Error('invalid cursor')
    }

    return {
      beforeNs: value.beforeNs,
      excludeIds: value.excludeIds,
      startNs: value.startNs,
      toNs: value.toNs,
    }
  } catch {
    throw new LogReaderInvalidCursorError('日志 cursor 无效')
  }
}

function toNanoseconds(value: string): string {
  return (BigInt(new Date(value).getTime()) * 1_000_000n).toString()
}

function fromNanoseconds(value: string): string {
  return new Date(Number(BigInt(value) / 1_000_000n)).toISOString()
}

function compareNanoseconds(left: string, right: string): number {
  const leftValue = BigInt(left)
  const rightValue = BigInt(right)
  return leftValue === rightValue ? 0 : leftValue > rightValue ? 1 : -1
}
