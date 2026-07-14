import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { AppLayout } from '@/components/layout/app-layout';
import { LoginPage } from '@/pages/login-page';
import { FindYourSeatPage } from '@/pages/find-your-seat-page';
import { InvitationPage } from '@/pages/invitation-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { EventEditorPage } from '@/pages/event-editor-page';
import { PrintSeatingChartPage } from '@/pages/print-seating-chart-page';
import { PrintGuestListPage } from '@/pages/print-guest-list-page';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/e/:slug" element={<FindYourSeatPage />} />
        <Route path="/invite/:slug" element={<InvitationPage />} />
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <AppLayout />
            </ProtectedLayout>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="events/:eventId" element={<EventEditorPage />} />
          <Route
            path="events/:eventId/print/seating"
            element={<PrintSeatingChartPage />}
          />
          <Route
            path="events/:eventId/print/guests"
            element={<PrintGuestListPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
