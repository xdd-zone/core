import type { FC, JSX } from 'react'

import { clsx } from 'clsx'

import { useMarkdownTheme } from '../theme/useTheme'

/**
 * 引用块组件：渲染语义化 `<blockquote>`
 * - 统一引用样式，支持浅色/深色主题的对比边框与背景
 */
export const Blockquote: FC<JSX.IntrinsicElements['blockquote']> = ({ children, className, ...rest }) => {
  const theme = useMarkdownTheme()
  return (
    <blockquote {...rest} className={clsx(theme.blockquote.blockquote, className)}>
      {children}
    </blockquote>
  )
}
