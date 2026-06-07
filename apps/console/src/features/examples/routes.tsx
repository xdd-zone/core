import type { ConsoleRouteRecord } from '@console/app/router/types'
import { lazyRouteComponent } from '@tanstack/react-router'
import { AlertTriangle, Crop, FileTextIcon, LayoutTemplate, Lock, Search, Settings2, SquarePen } from 'lucide-react'

export const exampleRoutes: ConsoleRouteRecord[] = [
  {
    component: lazyRouteComponent(() => import('./pages/UiShowcase'), 'UiShowcase'),
    icon: LayoutTemplate,
    id: 'examples.uiShowcase',
    layout: {
      contentWidth: 'full',
    },
    menu: {
      group: 'examples',
      order: 10,
    },
    path: '/ui-showcase',
    title: 'menu.uiShowcase',
  },
  {
    component: lazyRouteComponent(() => import('./pages/EnvExample'), 'EnvExample'),
    icon: Settings2,
    id: 'examples.env',
    menu: {
      group: 'examples',
      order: 15,
    },
    path: '/env-example',
    title: 'menu.envExample',
  },
  {
    component: lazyRouteComponent(() => import('./pages/MarkdownExample'), 'MarkdownExample'),
    icon: FileTextIcon,
    id: 'examples.markdown',
    menu: {
      group: 'examples',
      order: 20,
    },
    path: '/markdown-example',
    title: 'menu.markdownExample',
  },
  {
    component: lazyRouteComponent(() => import('./pages/TiptapExample'), 'TiptapExample'),
    icon: SquarePen,
    id: 'examples.tiptap',
    layout: {
      contentWidth: 'full',
    },
    menu: {
      group: 'examples',
      order: 30,
    },
    path: '/tiptap-example',
    title: 'menu.tiptapExample',
  },
  {
    component: lazyRouteComponent(() => import('./pages/ImageCropExample'), 'ImageCropExample'),
    icon: Crop,
    id: 'examples.imageCrop',
    layout: {
      contentWidth: 'full',
    },
    menu: {
      group: 'examples',
      order: 40,
    },
    path: '/image-crop',
    title: 'menu.imageCrop',
  },
  {
    component: lazyRouteComponent(() => import('./pages/ErrorStateExample'), 'ErrorStateExample'),
    icon: AlertTriangle,
    id: 'examples.errorState',
    menu: {
      group: 'examples',
      order: 50,
    },
    path: '/error-example',
    title: 'menu.errorExample',
  },
  {
    component: lazyRouteComponent(() => import('./pages/ForbiddenExample'), 'ForbiddenExample'),
    icon: Lock,
    id: 'examples.forbidden',
    menu: {
      group: 'examples',
      order: 60,
    },
    path: '/forbidden-example',
    title: 'menu.forbiddenExample',
  },
  {
    component: lazyRouteComponent(() => import('./pages/NotFoundExample'), 'NotFoundExample'),
    icon: Search,
    id: 'examples.notFound',
    menu: {
      group: 'examples',
      order: 70,
    },
    path: '/not-found-example',
    title: 'menu.notFoundExample',
  },
]
