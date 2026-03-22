/**
 * 从类名中解析代码语言标识：
 * - 支持 `lang-xxx` 或 `language-xxx` 形式
 * - 未匹配到则回退为 'text'
 */
export function getLanguageFromClassName(className: string): string {
  const match = /(?:lang|language)-([\w-]+)/.exec(className)
  return match ? match[1].toLowerCase() : 'text'
}

/**
 * 规范化代码文本：
 * - 将 CRLF 转为 LF
 * - 去掉首尾空行
 * - 计算并移除公共缩进
 */
export function normalizeCode(input: string): string {
  // 统一换行符并按行拆分
  const lines = input.replace(/\r\n?/g, '\n').split('\n')
  // 去除首部空行
  while (lines.length > 0 && lines[0].trim() === '') lines.shift()
  // 去除尾部空行
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop()
  // 收集所有非空行的前导空白个数
  const indents = lines
    .filter((l) => l.trim().length > 0)
    .map((l) => {
      const m = /^\s*/.exec(l)
      return m ? m[0].length : 0
    })
  // 求最小公共缩进
  const minIndent = indents.length > 0 ? Math.min(...indents) : 0
  // 移除每行的最小公共缩进
  const trimmed = lines.map((l) => (minIndent > 0 ? l.slice(minIndent) : l))
  return trimmed.join('\n')
}
