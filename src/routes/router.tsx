import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { ProtectedLayout } from '@/components/layout/protected-layout';

// Lazy-loaded page placeholders — these page components are expected to exist
// in src/pages/. Importing them directly keeps the router self-contained.
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

        <Route element={<ProtectedLayout />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/events/:eventId" element={<EventEditorPage />} />
          </Route>
        </Route>

        <Route path="/events/:eventId/print/seating" element={<PrintSeatingChartPage />} />
        <Route path="/events/:eventId/print/guests" element={<PrintGuestListPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
