import type { FC, JSX } from 'react'

import { clsx } from 'clsx'

import { useMarkdownTheme } from '../theme/useTheme'

/**
 * 图片组件：渲染 `<img>` 并默认启用懒加载
 * - 若未显式传入 `loading`，则设置为 `'lazy'`
 * - 使用主题类名统一尺寸与圆角
 */
export const Image: FC<JSX.IntrinsicElements['img']> = ({ className, ...rest }) => {
  const theme = useMarkdownTheme()
  return <img {...rest} loading={rest.loading ?? 'lazy'} className={clsx(theme.image.img, className)} />
}
