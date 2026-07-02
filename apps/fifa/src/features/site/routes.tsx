import type { FifaRouteRecord } from '@fifa/app/router/types'
import { lazyRouteComponent } from '@tanstack/react-router'
import { FolderKanban, Globe2, IdCard } from 'lucide-react'

export const siteRoutes: FifaRouteRecord[] = [
  {
    component: lazyRouteComponent(() => import('./pages/SiteConfig'), 'SiteConfig'),
    icon: Globe2,
    id: 'site.config',
    layout: {
      contentWidth: 'full',
    },
    menu: {
      group: 'site',
      order: 10,
    },
    path: '/site/config',
    title: 'menu.siteConfig',
  },
  {
    component: lazyRouteComponent(() => import('./pages/PublicProfile'), 'PublicProfile'),
    icon: IdCard,
    id: 'site.publicProfile',
    layout: {
      contentWidth: 'full',
    },
    menu: {
      group: 'site',
      order: 20,
    },
    path: '/site/profile',
    title: 'menu.publicProfile',
  },
  {
    component: lazyRouteComponent(() => import('./pages/ProjectList'), 'ProjectList'),
    icon: FolderKanban,
    id: 'site.projects',
    layout: {
      contentWidth: 'full',
    },
    menu: {
      group: 'site',
      order: 30,
    },
    path: '/site/projects',
    title: 'menu.projects',
  },
]
