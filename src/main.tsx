import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Router } from './router'
import './index.css'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1 } } })
const el = document.getElementById('root')!
createRoot(el).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  </StrictMode>
)
