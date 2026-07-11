import type { SystemLogEntry, SystemLogLevel, SystemLogListQuery } from '@xdd-zone/contracts'

export interface ResolvedSystemLogQuery extends Omit<SystemLogListQuery, 'from' | 'to'> {
  from: string
  to: string
}

export interface LogReaderHealth {
  status: 'disabled' | 'ready'
}

export interface LogReaderResult {
  from: string
  logs: SystemLogEntry[]
  nextCursor: string | null
  to: string
}

export interface LogReader {
  readonly enabled: boolean
  readonly provider: string
  health: () => Promise<LogReaderHealth>
  query: (input: ResolvedSystemLogQuery) => Promise<LogReaderResult>
}

export class LogReaderDisabledError extends Error {}
export class LogReaderInvalidCursorError extends Error {}
export class LogReaderUnavailableError extends Error {}
export class LogReaderTimeoutError extends Error {}

export const PINO_LEVEL_VALUES: Record<SystemLogLevel, number> = {
  debug: 20,
  error: 50,
  fatal: 60,
  info: 30,
  trace: 10,
  warn: 40,
}
