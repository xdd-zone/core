export function serializeCacheValue(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined
  }

  return JSON.stringify(value)
}

export function parseCacheValue<T>(value: string): T {
  return JSON.parse(value) as T
}

