import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { LoginPage } from '@/pages/login-page';
import { FindYourSeatPage } from '@/pages/find-your-seat-page';
import { InvitationPage } from '@/pages/invitation-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { EventSettingsPage } from '@/pages/event-settings-page';
import { GuestManagementPage } from '@/pages/guest-management-page';
import { SeatingArrangementPage } from '@/pages/seating-arrangement-page';
import { EventOverviewPage } from '@/pages/event-overview-page';
import { CheckInPage } from '@/pages/check-in-page';
import { AnalyticsPage } from '@/pages/analytics-page';
import { GuestPageEditor } from '@/pages/guest-page-editor';
import { PrintSeatingChartPage } from '@/pages/print-seating-chart-page';
import { PrintGuestListPage } from '@/pages/print-guest-list-page';

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/e/:eventSlug" element={<FindYourSeatPage />} />
        <Route path="/invite/:eventSlug" element={<InvitationPage />} />
        <Route element={<ProtectedLayout />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/events/:eventId" element={<EventSettingsPage />} />
            <Route
              path="/events/:eventId/guests"
              element={<GuestManagementPage />}
            />
            <Route
              path="/events/:eventId/seating"
              element={<SeatingArrangementPage />}
            />
            <Route
              path="/events/:eventId/overview"
              element={<EventOverviewPage />}
            />
            <Route path="/events/:eventId/check-in" element={<CheckInPage />} />
            <Route
              path="/events/:eventId/analytics"
              element={<AnalyticsPage />}
            />
            <Route
              path="/events/:eventId/guest-page"
              element={<GuestPageEditor />}
            />
            <Route
              path="/events/:eventId/print"
              element={<PrintSeatingChartPage />}
            />
            <Route
              path="/events/:eventId/print/guest-list"
              element={<PrintGuestListPage />}
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
