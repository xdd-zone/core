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
    <div className="site-nav-menu-panel">
      <div className="site-nav-menu-col">
        <div className="site-nav-menu-head">
          <span>分类</span>
          <span>{totalPostCount} 篇</span>
        </div>
        <div className="site-nav-category-list">
          {categories.map((category) => (
            <Link
              className={category.id === activeCategory?.id ? 'active' : undefined}
              href={`/writing?category=${encodeURIComponent(category.slug)}`}
              key={category.id}
              onFocus={() => setActiveCategoryId(category.id)}
              onMouseEnter={() => setActiveCategoryId(category.id)}
            >
              <span>{category.name}</span>
              <span>{category.postCount}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="site-nav-menu-col">
        <div className="site-nav-menu-head">
          <span>{activeCategory?.name ?? '最近'} · 最近</span>
        </div>
        {activeCategory && activeCategory.posts.length > 0 ? (
          <div className="site-nav-post-list">
            {activeCategory.posts.slice(0, 5).map((post) => (
              <Link href={`/writing/${post.slug}`} key={post.id}>
                <span>{post.title}</span>
                <time>{formatMenuDate(post.publishedAt ?? post.updatedAt)}</time>
              </Link>
            ))}
          </div>
        ) : (
          <div className="site-nav-menu-empty">暂无公开文稿</div>
        )}
        <Link className="site-nav-menu-all" href="/writing">
          <span>查看全部文稿</span>
          <span>{totalPostCount} 篇</span>
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
