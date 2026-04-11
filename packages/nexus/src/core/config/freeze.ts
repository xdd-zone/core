export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
    return value
  }

  const target = value as Record<string, unknown>

  for (const nested of Object.values(target)) {
    deepFreeze(nested)
  }

  return Object.freeze(value)
}
