import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/login-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { EventEditorPage } from '@/pages/event-editor-page';
import { PrintSeatingChartPage } from '@/pages/print-seating-chart-page';
import { PrintGuestListPage } from '@/pages/print-guest-list-page';
import { InvitationPage } from '@/pages/invitation-page';
import { FindYourSeatPage } from '@/pages/find-your-seat-page';
import { ProtectedLayout } from '@/components/protected-layout';
import { AppLayout } from '@/components/app-layout';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedLayout>
        <AppLayout>
          <DashboardPage />
        </AppLayout>
      </ProtectedLayout>
    ),
  },
  {
    path: '/events/:eventId',
    element: (
      <ProtectedLayout>
        <AppLayout>
          <EventEditorPage />
        </AppLayout>
      </ProtectedLayout>
    ),
  },
  {
    path: '/events/:eventId/print/seating-chart',
    element: (
      <ProtectedLayout>
        <AppLayout>
          <PrintSeatingChartPage />
        </AppLayout>
      </ProtectedLayout>
    ),
  },
  {
    path: '/events/:eventId/print/guest-list',
    element: (
      <ProtectedLayout>
        <AppLayout>
          <PrintGuestListPage />
        </AppLayout>
      </ProtectedLayout>
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
    element: <LoginPage />,
  },
]);
