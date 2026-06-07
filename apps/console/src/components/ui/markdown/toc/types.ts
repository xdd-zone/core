import type { RefObject } from 'react'

export interface TocItem {
  id: string
  level: number
  text: string
}

export interface UseTocOptions {
  containerRef: RefObject<HTMLDivElement | null>
  maxLevel?: number
  minLevel?: number
}
