import type { BizCodeValue } from '@xdd-zone/contracts'
import type { z } from 'zod'

export type PublicCmsErrorReason = 'request-failed' | 'invalid-response'

export class PublicCmsError extends Error {
  readonly code?: BizCodeValue
  readonly reason: PublicCmsErrorReason

  constructor(reason: PublicCmsErrorReason, message: string, code?: BizCodeValue) {
    super(message)
    this.name = 'PublicCmsError'
    this.reason = reason
    this.code = code
  }
}

export function assertPublicCmsData<TData>(data: unknown, schema: z.ZodType<TData>, message: string): TData {
  const parsed = schema.safeParse(data)

  if (!parsed.success) {
    throw new PublicCmsError('invalid-response', message)
  }

  return parsed.data
}
