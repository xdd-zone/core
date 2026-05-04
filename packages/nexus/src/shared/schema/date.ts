export function serializeDateTime(value: Date): string
export function serializeDateTime(value: Date | null): string | null
export function serializeDateTime(value: Date | null | undefined): string | null | undefined
export function serializeDateTime(value: Date | null | undefined): string | null | undefined {
  return value instanceof Date ? value.toISOString() : value
}
