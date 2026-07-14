import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { ToastProvider } from '@/providers/toast-provider';
import { AppRouter } from '@/routes/router';

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
