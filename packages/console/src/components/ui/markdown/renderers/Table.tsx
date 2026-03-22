import type { FC, JSX } from 'react'

import { clsx } from 'clsx'

import { useMarkdownTheme } from '../theme/useTheme'

/**
 * 表格容器：外包一层滚动容器，避免宽表格溢出
 */
export const Table: FC<JSX.IntrinsicElements['table']> = ({ children, className, ...rest }) => {
  const theme = useMarkdownTheme()
  return (
    <div className={clsx(theme.table.container)}>
      <table {...rest} className={clsx(theme.table.table, className)}>
        {children}
      </table>
    </div>
  )
}

/**
 * 表头 `<thead>`：强调列标题区域样式
 */
export const Thead: FC<JSX.IntrinsicElements['thead']> = ({ children, className, ...rest }) => {
  const theme = useMarkdownTheme()
  return (
    <thead {...rest} className={clsx(theme.table.thead, className)}>
      {children}
    </thead>
  )
}

/**
 * 表体 `<tbody>`：承载数据行区域
 */
export const Tbody: FC<JSX.IntrinsicElements['tbody']> = ({ children, className, ...rest }) => {
  const theme = useMarkdownTheme()
  return (
    <tbody {...rest} className={clsx(theme.table.tbody, className)}>
      {children}
    </tbody>
  )
}

/**
 * 表行 `<tr>`：交替背景提升可读性
 */
export const Tr: FC<JSX.IntrinsicElements['tr']> = ({ children, className, ...rest }) => {
  const theme = useMarkdownTheme()
  return (
    <tr {...rest} className={clsx(theme.table.tr, className)}>
      {children}
    </tr>
  )
}

/**
 * 表头单元格 `<th>`：强调列名，应用主题排版
 */
export const Th: FC<JSX.IntrinsicElements['th']> = ({ children, className, ...rest }) => {
  const theme = useMarkdownTheme()
  return (
    <th {...rest} className={clsx(theme.table.th, className)}>
      {children}
    </th>
  )
}

/**
 * 表体单元格 `<td>`：统一边框与内边距
 */
export const Td: FC<JSX.IntrinsicElements['td']> = ({ children, className, ...rest }) => {
  const theme = useMarkdownTheme()
  return (
    <td {...rest} className={clsx(theme.table.td, className)}>
      {children}
    </td>
  )
}
