import type { FC, JSX } from 'react'

import { clsx } from 'clsx'

import { useMarkdownTheme } from '../theme/useTheme'

/**
 * 分隔线渲染组件：应用主题样式的 `<hr>`
 * - 使用 `useMarkdownTheme` 获取当前 Markdown 主题
 * - 通过 `clsx` 合并外部 `className` 与主题类名
 */
export const Hr: FC<JSX.IntrinsicElements['hr']> = ({ className, ...rest }) => {
  const theme = useMarkdownTheme()
  return <hr {...rest} className={clsx(theme.hr.hr, className)} />
}
