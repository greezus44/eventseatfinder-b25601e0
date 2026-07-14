import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/protected-route'
import LoginPage from '@/pages/login-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { EventEditorPage } from '@/pages/event-editor-page'
import { InvitationPage } from '@/pages/invitation-page'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/dashboard', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
  { path: '/events/:eventId', element: <ProtectedRoute><EventEditorPage /></ProtectedRoute> },
  { path: '/e/:slug', element: <InvitationPage /> },
  { path: '/find-your-seat/:slug', element: <InvitationPage /> },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
