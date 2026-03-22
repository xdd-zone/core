import type { RouteObject } from 'react-router'

import { Crop, Layers } from 'lucide-react'
import { Navigate } from 'react-router'

import { RouteType } from '../types'

/**
 * 功能示例路由
 */
export const exampleRoutes: RouteObject[] = [
  {
    children: [
      {
        element: <Navigate to="/example/table" replace />,
        index: true,
      },
      {
        handle: {
          icon: Crop,
          title: 'menu.imageCrop',
          type: RouteType.MENU,
        },
        lazy: async () => {
          const { ImageCropExample } = await import('@/pages/example/ImageCropExample')

          return { Component: ImageCropExample }
        },
        path: 'crop',
      },
    ],
    handle: {
      icon: Layers,
      title: 'menu.exampleFeatures',
      type: RouteType.MENU,
    },
    path: '/example',
  },
]
