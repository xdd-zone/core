const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function createSlug(input: string, fallbackPrefix: string = 'item') {
  const normalized = input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

  if (SLUG_PATTERN.test(normalized)) {
    return normalized
  }

  const fallbackSuffix = Array.from(input.trim())
    .map((char) => char.codePointAt(0)?.toString(36) ?? '')
    .join('-')
    .replace(/^-+|-+$/g, '')

  return `${fallbackPrefix}-${fallbackSuffix || 'untitled'}`
}

export function isSlug(value: string) {
  return SLUG_PATTERN.test(value)
}
