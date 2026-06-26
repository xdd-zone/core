import type { FifaRouteRecord } from '@fifa/app/router/types'
import { lazyRouteComponent } from '@tanstack/react-router'
import { FileImage, FileText, Pencil } from 'lucide-react'

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
    component: lazyRouteComponent(() => import('./pages/AssetList'), 'AssetList'),
    icon: FileImage,
    id: 'content.assets',
    layout: {
      contentWidth: 'full',
    },
    menu: {
      group: 'content',
      order: 15,
    },
    path: '/content/assets',
    title: 'menu.assets',
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
