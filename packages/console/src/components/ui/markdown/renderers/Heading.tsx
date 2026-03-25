import { clsx } from 'clsx'
import React from 'react'

import { useMarkdownTheme } from '../theme/useTheme'
import { extractText, slugify } from '../utils/slugify'

const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

function createHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  const tagName = headingTags[level - 1]

  return ({
    children,
    className,
    ...rest
  }: {
    [key: string]: unknown
    children?: React.ReactNode
    className?: string
  }) => {
    const theme = useMarkdownTheme()
    const text = extractText(children)
    const id = slugify(text)

    const headingProps = {
      ...rest,
      className: clsx('group', theme.heading[`h${level}`], className),
      id,
    }

    const anchor = id ? (
      <a href={`#${id}`} className={clsx(theme.heading.anchor)} aria-label="Anchor">
        #
      </a>
    ) : null

    return (
      <div style={{ display: 'contents' }}>
        {/* 使用 createElement 动态创建标题元素 */}
        {React.createElement(tagName, headingProps, children, anchor)}
      </div>
    )
  }
}

export const H1 = createHeading(1)
export const H2 = createHeading(2)
export const H3 = createHeading(3)
export const H4 = createHeading(4)
export const H5 = createHeading(5)
export const H6 = createHeading(6)
