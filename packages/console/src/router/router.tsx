import { createBrowserRouter, Navigate } from 'react-router'

import { ErrorBoundary } from '@/components/ui'
import { HydrateFallback } from '@/components/ui/HydrateFallback'
import { RootLayout } from '@/layout'

import { Guard } from './auth'
import { articleRoutes, dashboardRoutes, errorRoutes, exampleRoutes, loginRoutes } from './routes'

export const privateRoutes = [
  {
    children: [
      {
        element: <Navigate to="/dashboard" replace />,
        index: true,
      },
      ...dashboardRoutes,
      ...articleRoutes,
      ...exampleRoutes,
    ],
    element: (
      <Guard>
        <RootLayout />
      </Guard>
    ),
    errorElement: <ErrorBoundary />,
    HydrateFallback,
    path: '/',
  },
]

export const publicRoutes = [...loginRoutes, ...errorRoutes]

export const router = createBrowserRouter([...publicRoutes, ...privateRoutes])
