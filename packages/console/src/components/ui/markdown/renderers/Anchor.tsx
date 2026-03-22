import type { FC, JSX } from 'react'

import { clsx } from 'clsx'

import { useMarkdownTheme } from '../theme/useTheme'

/**
 * 链接组件：渲染 `<a>` 并区分外链行为
 * - `href` 为 `http/https` 时自动添加 `target="_blank"` 与安全 `rel`
 * - 使用主题样式统一链接外观与交互
 */
export const Anchor: FC<JSX.IntrinsicElements['a']> = ({ children, className, href, ...rest }) => {
  const theme = useMarkdownTheme()
  const isExternal = typeof href === 'string' && /^https?:\/\//.test(href)
  return (
    <a
      {...rest}
      href={href}
      target={isExternal ? '_blank' : rest.target}
      rel={isExternal ? 'noopener noreferrer' : rest.rel}
      className={clsx(theme.anchor.a, className)}
    >
      {children}
    </a>
  )
}
