'use client';

import { useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use useRef instead of useState for more stable instance across hydration
  // This is especially important in production builds where React hydration
  // can cause useState to reinitialize, losing the QueryClient cache
  const queryClientRef = useRef<QueryClient | undefined>(undefined);

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          // Refetch on mount if data is stale (safety net for iOS navigation issues)
          refetchOnMount: true,
          // Disable window focus refetch to prevent iOS Safari focus issues
          refetchOnWindowFocus: false,
          // Keep stale time short to ensure fresh data
          staleTime: 0,
          // Retry failed requests (helps with network issues on mobile)
          retry: 3,
          retryDelay: (attemptIndex) =>
            Math.min(1000 * 2 ** attemptIndex, 30000),
        },
      },
    });
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
    </QueryClientProvider>
  );
}
