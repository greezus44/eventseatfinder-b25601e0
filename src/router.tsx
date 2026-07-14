import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import { LoginPage } from '@/pages/login-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { EventEditorPage } from '@/pages/event-editor-page'
import { InvitationPage } from '@/pages/invitation-page'
import { ProtectedRoute } from '@/components/protected-route'

function FindSeatRedirect() {
  const { slug } = useParams<{ slug: string }>()
  return <Navigate to={`/e/${slug}`} replace />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/dashboard', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
  { path: '/events/:eventId', element: <ProtectedRoute><EventEditorPage /></ProtectedRoute> },
  { path: '/e/:slug', element: <InvitationPage /> },
  { path: '/find-your-seat/:slug', element: <FindSeatRedirect /> },
  { path: '/', element: <Navigate to="/login" replace /> },
])
