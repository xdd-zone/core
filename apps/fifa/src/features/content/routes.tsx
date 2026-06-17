import type { FifaRouteRecord } from '@fifa/app/router/types'
import { lazyRouteComponent } from '@tanstack/react-router'
import { FileText, Pencil } from 'lucide-react'

export const contentRoutes: FifaRouteRecord[] = [
  {
    component: lazyRouteComponent(() => import('./pages/PostList'), 'PostList'),
    icon: FileText,
    id: 'content.posts',
    layout: {
      contentWidth: 'full',
    },
    menu: {
      group: 'content',
      order: 10,
    },
    path: '/content/posts',
    title: 'menu.posts',
  },
  {
    component: lazyRouteComponent(() => import('./pages/PostEdit'), 'PostEdit'),
    icon: Pencil,
    id: 'content.postEdit',
    layout: {
      contentWidth: 'full',
    },
    menu: false,
    path: '/content/posts/$postId',
    title: 'menu.postEdit',
  },
]
