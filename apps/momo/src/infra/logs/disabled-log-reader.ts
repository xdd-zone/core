import type { LogReader, LogReaderHealth, LogReaderResult, ResolvedSystemLogQuery } from './log-reader'
import { LogReaderDisabledError } from './log-reader'

export class DisabledLogReader implements LogReader {
  readonly enabled = false
  readonly provider = 'none'

  async health(): Promise<LogReaderHealth> {
    return { status: 'disabled' }
  }

  async query(_input: ResolvedSystemLogQuery): Promise<LogReaderResult> {
    throw new LogReaderDisabledError('日志查询未启用')
  }
}
