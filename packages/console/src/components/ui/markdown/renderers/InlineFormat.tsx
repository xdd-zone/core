import type { FC, JSX } from 'react'

import { clsx } from 'clsx'

import { useMarkdownTheme } from '../theme/useTheme'

/**
 * 行内加粗：语义化 `<strong>` 包裹，突出重要词句
 */
export const Strong: FC<JSX.IntrinsicElements['strong']> = ({ children, className, ...rest }) => {
  const theme = useMarkdownTheme()
  return (
    <strong {...rest} className={clsx(theme.inline.strong, className)}>
      {children}
    </strong>
  )
}

/**
 * 行内斜体：语义化 `<em>` 包裹，表达强调语义
 */
export const Em: FC<JSX.IntrinsicElements['em']> = ({ children, className, ...rest }) => {
  const theme = useMarkdownTheme()
  return (
    <em {...rest} className={clsx(theme.inline.em, className)}>
      {children}
    </em>
  )
}

/**
 * 行内删除线：语义化 `<del>` 包裹，表示内容已废弃或更改
 */
export const Del: FC<JSX.IntrinsicElements['del']> = ({ children, className, ...rest }) => {
  const theme = useMarkdownTheme()
  return (
    <del {...rest} className={clsx(theme.inline.del, className)}>
      {children}
    </del>
  )
}
