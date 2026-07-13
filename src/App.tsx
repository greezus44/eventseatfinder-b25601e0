import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes/router';
import { ThemeProvider } from '@/providers/theme-provider';
import { ToastProvider } from '@/providers/toast-provider';
import { QueryProvider } from '@/providers/query-provider';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <QueryProvider>
          <RouterProvider router={router} />
        </QueryProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
