import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { AppLayout } from '@/components/layout/app-layout';
import { LoginPage } from '@/pages/login-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { EventSettingsPage } from '@/pages/event-settings-page';
import { FindYourSeatPage } from '@/pages/find-your-seat-page';
import { GuestManagementPage } from '@/pages/guest-management-page';
import { SeatingArrangementPage } from '@/pages/seating-arrangement-page';
import { InvitationPage } from '@/pages/invitation-page';
import { EventOverviewPage } from '@/pages/event-overview-page';
import { PrintSeatingChartPage } from '@/pages/print-seating-chart-page';
import { PrintGuestListPage } from '@/pages/print-guest-list-page';
import { CheckInPage } from '@/pages/check-in-page';
import { AnalyticsPage } from '@/pages/analytics-page';
import { GuestPageEditorPage } from '@/pages/guest-page-editor';

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/e/:eventSlug" element={<FindYourSeatPage />} />
        <Route path="/invite/:eventSlug" element={<InvitationPage />} />
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedLayout>
          }
        />
        <Route
          path="/events/:eventId"
          element={
            <ProtectedLayout>
              <AppLayout>
                <EventSettingsPage />
              </AppLayout>
            </ProtectedLayout>
          }
        />
        <Route
          path="/events/:eventId/guests"
          element={
            <ProtectedLayout>
              <AppLayout>
                <GuestManagementPage />
              </AppLayout>
            </ProtectedLayout>
          }
        />
        <Route
          path="/events/:eventId/seating"
          element={
            <ProtectedLayout>
              <AppLayout>
                <SeatingArrangementPage />
              </AppLayout>
            </ProtectedLayout>
          }
        />
        <Route
          path="/events/:eventId/overview"
          element={
            <ProtectedLayout>
              <AppLayout>
                <EventOverviewPage />
              </AppLayout>
            </ProtectedLayout>
          }
        />
        <Route
          path="/events/:eventId/check-in"
          element={
            <ProtectedLayout>
              <AppLayout>
                <CheckInPage />
              </AppLayout>
            </ProtectedLayout>
          }
        />
        <Route
          path="/events/:eventId/analytics"
          element={
            <ProtectedLayout>
              <AppLayout>
                <AnalyticsPage />
              </AppLayout>
            </ProtectedLayout>
          }
        />
        <Route
          path="/events/:eventId/guest-page"
          element={
            <ProtectedLayout>
              <AppLayout>
                <GuestPageEditorPage />
              </AppLayout>
            </ProtectedLayout>
          }
        />
        <Route
          path="/events/:eventId/print"
          element={
            <ProtectedLayout>
              <AppLayout>
                <PrintSeatingChartPage />
              </AppLayout>
            </ProtectedLayout>
          }
        />
        <Route
          path="/events/:eventId/print/guest-list"
          element={
            <ProtectedLayout>
              <AppLayout>
                <PrintGuestListPage />
              </AppLayout>
            </ProtectedLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
