import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { DashboardPage } from '@/pages/dashboard-page';
import { EventSettingsPage } from '@/pages/event-settings-page';
import { GuestManagementPage } from '@/pages/guest-management-page';
import { SeatingArrangementPage } from '@/pages/seating-arrangement-page';
import { EventOverviewPage } from '@/pages/event-overview-page';
import { LoginPage } from '@/pages/login-page';
import { FindYourSeatPage } from '@/pages/find-your-seat-page';
import { InvitationPage } from '@/pages/invitation-page';

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/e/:eventSlug',
    element: <FindYourSeatPage />,
  },
  {
    path: '/invite/:eventSlug',
    element: <InvitationPage />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            path: '/',
            element: <DashboardPage />,
          },
          {
            path: '/events/:eventId',
            element: <EventSettingsPage />,
          },
          {
            path: '/events/:eventId/guests',
            element: <GuestManagementPage />,
          },
          {
            path: '/events/:eventId/seating',
            element: <SeatingArrangementPage />,
          },
          {
            path: '/events/:eventId/overview',
            element: <EventOverviewPage />,
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
