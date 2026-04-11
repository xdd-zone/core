import type { CSSProperties } from 'react'

export const ARTICLE_PAGE_CLASSNAME = 'flex min-h-full flex-col gap-5'

export const ARTICLE_PANEL_CLASSNAME = 'flex flex-1 flex-col overflow-hidden rounded-2xl'

export const ARTICLE_PANEL_BODY_STYLE: CSSProperties = {
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  minHeight: 0,
}

export const ARTICLE_TABLE_CLASSNAME = [
  'flex-1',
  '[&_.ant-spin-nested-loading]:flex',
  '[&_.ant-spin-nested-loading]:h-full',
  '[&_.ant-spin-container]:flex',
  '[&_.ant-spin-container]:h-full',
  '[&_.ant-spin-container]:flex-col',
  '[&_.ant-table]:flex',
  '[&_.ant-table]:h-full',
  '[&_.ant-table]:flex-col',
  '[&_.ant-table-container]:flex-1',
  '[&_.ant-table-container]:overflow-auto',
].join(' ')
