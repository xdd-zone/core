/**
 * 将任意输入文本转换为 URL 友好的 slug：
 * - 优先保留字母/数字/空格与连字符，其他字符移除
 * - 空白转换为 `-`，并归一化为小写
 * - 当清洗后为空时，回退为 `encodeURIComponent` 保障可用性
 */
export function slugify (input: string): string {
  const base = input.trim()
  if (base.length === 0) return ''
  const cleaned = base
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
  if (cleaned.length > 0) return cleaned
  return encodeURIComponent(base.replace(/\s+/g, '-'))
}

/**
 * 从 React 节点树递归提取文本内容：
 * - 支持字符串、数组与含 `props.children` 的对象
 * - 用于从标题组件的复杂子节点中提取纯文本
 */
export function extractText (node: unknown): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map((n) => extractText(n)).join('')
  if (node && typeof node === 'object' && 'props' in (node as Record<string, unknown>)) {
    const props = (node as { props?: { children?: unknown } }).props
    return extractText(props?.children)
  }
  return ''
}
