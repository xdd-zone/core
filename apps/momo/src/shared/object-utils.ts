/** 从 object 上取 string 类型的属性，取不到返回 undefined */
export function getStringProperty(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const property = (value as Record<string, unknown>)[key]

  return typeof property === 'string' ? property : undefined
}

/** 从 object 上取 number 类型的属性，取不到返回 undefined */
export function getNumberProperty(value: unknown, key: string): number | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const property = (value as Record<string, unknown>)[key]

  return typeof property === 'number' ? property : undefined
}
