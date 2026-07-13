import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

const defaultOptions: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
};

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient(defaultOptions));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
