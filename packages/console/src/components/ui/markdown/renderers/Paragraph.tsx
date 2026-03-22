import type { FC, JSX } from 'react'

import { clsx } from 'clsx'

import { useMarkdownTheme } from '../theme/useTheme'

/**
 * 段落渲染组件：语义化 `<p>` 包裹文本内容
 * - 保持 prose 排版一致性（通过主题的 `paragraph.p`）
 * - 支持外部传入 `className` 进行样式微调
 */
export const Paragraph: FC<JSX.IntrinsicElements['p']> = ({ children, className, ...rest }) => {
  const theme = useMarkdownTheme()
  return (
    <p {...rest} className={clsx(theme.paragraph.p, className)}>
      {children}
    </p>
  )
}
