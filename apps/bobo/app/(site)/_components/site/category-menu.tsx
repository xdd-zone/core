'use client'

import type { PublicCategoryMenuItem } from '@/lib/content/public-content'
import Link from 'next/link'

import { useState } from 'react'

interface CategoryMenuProps {
  categories: PublicCategoryMenuItem[]
  totalPostCount: number
}

export function CategoryMenu({ categories, totalPostCount }: CategoryMenuProps) {
  const defaultCategoryId = (categories.find((category) => category.posts.length > 0) ?? categories[0])?.id
  const [activeCategoryId, setActiveCategoryId] = useState(defaultCategoryId)
  const activeCategory = categories.find((category) => category.id === activeCategoryId) ?? categories[0]

  return (
    <div className="absolute top-[calc(100%+28px)] left-1/2 max-md:left-0 max-md:right-auto grid grid-cols-[150px_minmax(300px,1fr)] max-md:grid-cols-1 gap-5 w-[min(650px,calc(100vw-32px))] max-md:w-[min(340px,calc(100vw-24px))] border border-border rounded-2xl bg-surface/98 shadow-[0_24px_70px_rgba(0,0,0,0.42)] opacity-0 p-4.5 pointer-events-none -translate-x-1/2 max-md:-translate-x-19 -translate-y-1.5 transition-all duration-200 invisible group-hover/nav:opacity-100 group-hover/nav:pointer-events-auto group-hover/nav:-translate-x-1/2 max-md:group-hover/nav:-translate-x-19 group-hover/nav:translate-y-0 group-hover/nav:visible group-focus-within/nav:opacity-100 group-focus-within/nav:pointer-events-auto group-focus-within/nav:-translate-x-1/2 max-md:group-focus-within/nav:-translate-x-19 group-focus-within/nav:translate-y-0 group-focus-within/nav:visible">
      <div>
        <div className="flex justify-between gap-4.5 mb-3 text-muted-foreground text-[0.72rem] tracking-[0.2em] uppercase">
          <span>分类</span>
          <span className="tabular-nums">{totalPostCount} 篇</span>
        </div>
        <div className="grid gap-1">
          {categories.map((category) => (
            <Link
              className={`flex justify-between gap-4.5 items-center rounded-[10px] text-[0.9rem] px-3 py-2.75 transition-[background,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1 ${
                category.id === activeCategory?.id
                  ? 'bg-border/50 translate-x-0.5 text-foreground'
                  : 'text-foreground hover:bg-border/50 hover:translate-x-0.5 focus-visible:bg-border/50 focus-visible:translate-x-0.5'
              }`}
              href={`/writing?category=${encodeURIComponent(category.slug)}`}
              key={category.id}
              onFocus={() => setActiveCategoryId(category.id)}
              onMouseEnter={() => setActiveCategoryId(category.id)}
            >
              <span>{category.name}</span>
              <span className="text-muted-foreground tabular-nums">{category.postCount}</span>
            </Link>
          ))}
        </div>
      </div>
      <div>
        <div className="flex justify-between gap-4.5 mb-3 text-muted-foreground text-[0.72rem] tracking-[0.2em] uppercase">
          <span>{activeCategory?.name ?? '最近'} · 最近</span>
        </div>
        {activeCategory && activeCategory.posts.length > 0 ? (
          <div className="grid gap-2">
            {activeCategory.posts.slice(0, 5).map((post) => (
              <Link
                className="flex flex-col gap-2 rounded-[10px] bg-background/32 text-foreground px-3.5 py-3 transition-[background,transform] duration-200 hover:bg-border/50 hover:translate-x-0.5 focus-visible:bg-border/50 focus-visible:translate-x-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1"
                href={`/writing/${post.slug}`}
                key={post.id}
              >
                <span className="text-[0.9rem] leading-[1.42] line-clamp-2">{post.title}</span>
                <time className="text-muted-foreground text-[0.78rem]">
                  {formatMenuDate(post.publishedAt ?? post.updatedAt)}
                </time>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground text-[0.78rem] rounded-[10px] bg-background/28 p-3.5">暂无公开文稿</div>
        )}
        <Link
          className="flex justify-between gap-4.5 items-center border-t border-border text-foreground text-[0.86rem] mt-3.5 pt-3.5 px-0.5 pb-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1"
          href="/writing"
        >
          <span>查看全部文稿</span>
          <span className="text-muted-foreground tabular-nums">{totalPostCount} 篇</span>
        </Link>
      </div>
    </div>
  )
}

function formatMenuDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}
