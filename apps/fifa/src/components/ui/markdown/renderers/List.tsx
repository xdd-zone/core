import type { FC, JSX } from 'react'

import { clsx } from 'clsx'

import { useMarkdownTheme } from '../theme/useTheme'

/**
 * 无序列表：渲染 `<ul>`，统一列表缩进与行高
 */
export const Ul: FC<JSX.IntrinsicElements['ul']> = ({ children, className, ...rest }) => {
  const theme = useMarkdownTheme()
  return (
    <ul {...rest} className={clsx(theme.list.ul, className)}>
      {children}
    </ul>
  )
}

/**
 * 有序列表：渲染 `<ol>`，保持数字序号风格一致
 */
export const Ol: FC<JSX.IntrinsicElements['ol']> = ({ children, className, ...rest }) => {
  const theme = useMarkdownTheme()
  return (
    <ol {...rest} className={clsx(theme.list.ol, className)}>
      {children}
    </ol>
  )
}

/**
 * 列表项：渲染 `<li>`，继承父级列表的排版特性
 */
export const Li: FC<JSX.IntrinsicElements['li']> = ({ children, className, ...rest }) => {
  const theme = useMarkdownTheme()
  return (
    <li {...rest} className={clsx(theme.list.li, className)}>
      {children}
    </li>
  )
}
