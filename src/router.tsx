import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { ToastProvider } from '@/providers/toast-provider';
import { ProtectedLayout } from '@/components/protected-layout';
import { AppLayout } from '@/components/app-layout';
import { LoginPage } from '@/pages/login-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { EventEditorPage } from '@/pages/event-editor-page';
import { PrintSeatingChartPage } from '@/pages/print-seating-chart-page';
import { PrintGuestListPage } from '@/pages/print-guest-list-page';
import { FindYourSeatPage } from '@/pages/find-your-seat-page';
import { InvitationPage } from '@/pages/invitation-page';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedLayout>
        <AppLayout>
          <DashboardPage />
        </AppLayout>
      </ProtectedLayout>
    ),
  },
  {
    path: '/events/:id',
    element: (
      <ProtectedLayout>
        <AppLayout>
          <EventEditorPage />
        </AppLayout>
      </ProtectedLayout>
    ),
  },
  {
    path: '/events/:id/print/seating-chart',
    element: <PrintSeatingChartPage />,
  },
  {
    path: '/events/:id/print/guest-list',
    element: <PrintGuestListPage />,
  },
  {
    path: '/find-your-seat/:slug',
    element: <FindYourSeatPage />,
  },
  {
    path: '/invitation/:slug',
    element: <InvitationPage />,
  },
]);

export function Router() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
