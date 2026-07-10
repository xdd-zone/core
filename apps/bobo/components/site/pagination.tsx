import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export interface PaginationProps {
  currentPage: number
  totalPages?: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  nextHref: string
  previousHref: string
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  nextHref,
  previousHref,
  className,
}: PaginationProps) {
  return (
    <nav
      aria-label="分页导航"
      className={cn('group relative mt-16 flex items-center justify-between gap-4 pt-8', className)}
    >
      <div className="absolute left-0 top-0 h-[1px] w-full bg-border/50 transition-colors duration-500 group-hover:bg-border" />

      {hasPreviousPage ? (
        <Link
          href={previousHref}
          className="group/link inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 ease-out group-hover/link:-translate-x-1" />
          <span>上一页</span>
        </Link>
      ) : (
        <span className="inline-flex cursor-not-allowed items-center gap-2 text-sm text-muted-foreground/40">
          <ArrowLeft className="h-4 w-4" />
          <span>上一页</span>
        </span>
      )}

      <span className="font-medium tabular-nums tracking-widest text-muted-foreground text-[0.85rem]">
        {totalPages ? `${currentPage} / ${totalPages}` : `PAGE ${currentPage}`}
      </span>

      {hasNextPage ? (
        <Link
          href={nextHref}
          className="group/link inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <span>下一页</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover/link:translate-x-1" />
        </Link>
      ) : (
        <span className="inline-flex cursor-not-allowed items-center gap-2 text-sm text-muted-foreground/40">
          <span>下一页</span>
          <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  )
}
