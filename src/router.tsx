import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/login-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { EventEditorPage } from '@/pages/event-editor-page'
import { InvitationPage } from '@/pages/invitation-page'
import { FindYourSeatPage } from '@/pages/find-your-seat-page'
import { ProtectedRoute } from '@/components/protected-route'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/events/:eventId',
    element: (
      <ProtectedRoute>
        <EventEditorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/e/:slug',
    element: <InvitationPage />,
  },
  {
    path: '/find-your-seat/:slug',
    element: <FindYourSeatPage />,
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
])
