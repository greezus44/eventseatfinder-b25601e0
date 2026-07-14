import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/providers/auth-provider'
import { ToastProvider } from '@/providers/toast-provider'
import { ConfirmDialogProvider } from '@/providers/confirm-dialog'
import AppHeader from '@/components/app-header'
import ProtectedRoute from '@/components/protected-route'
import LoginPage from '@/pages/login-page'
import DashboardPage from '@/pages/dashboard-page'
import EventEditorPage from '@/pages/event-editor-page'
import InvitationPage from '@/pages/invitation-page'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmDialogProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/invite/:id" element={<InvitationPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppHeader />
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/events/:id" element={<EventEditorPage />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </ConfirmDialogProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
