import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/providers/auth-provider'
import { ToastProvider } from '@/providers/toast-provider'
import { ConfirmDialogProvider } from '@/providers/confirm-dialog'
import { ProtectedRoute } from '@/components/protected-route'
import LoginPage from '@/pages/login-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { EventEditorPage } from '@/pages/event-editor-page'
import { InvitationPage } from '@/pages/invitation-page'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
  { path: '/events/:eventId', element: <ProtectedRoute><EventEditorPage /></ProtectedRoute> },
  { path: '/e/:slug', element: <InvitationPage /> },
])

export function Router() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmDialogProvider>
          <RouterProvider router={router} />
        </ConfirmDialogProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
