import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/app-layout';
import { ProtectedLayout } from '@/components/protected-layout';
import { DashboardPage } from '@/pages/dashboard-page';
import { LoginPage } from '@/pages/login-page';
import { EventEditorPage } from '@/pages/event-editor-page';
import { FindYourSeatPage } from '@/pages/find-your-seat-page';
import { InvitationPage } from '@/pages/invitation-page';
import { PrintSeatingChartPage } from '@/pages/print-seating-chart-page';
import { PrintGuestListPage } from '@/pages/print-guest-list-page';

export const router = createBrowserRouter([
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
