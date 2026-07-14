import { Router } from '@/routes/router';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ToastProvider } from '@/providers/toast-provider';
export default function App() { return (<QueryProvider><AuthProvider><ToastProvider><Router /></ToastProvider></AuthProvider></QueryProvider>); }
