import type { FC, JSX } from 'react'

import { clsx } from 'clsx'

import { useMarkdownTheme } from '../theme/useTheme'

/**
 * 行内代码：渲染 `<code>` 并应用等宽字体与背景
 * - 适合短片段代码或命令、变量名展示
 */
export const CodeInline: FC<JSX.IntrinsicElements['code']> = ({ children, className, ...rest }) => {
  const theme = useMarkdownTheme()
  return (
    <code {...rest} className={clsx(theme.inline.code, className)}>
      {children}
    </code>
  )
}
