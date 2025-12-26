'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create a stable QueryClient instance that persists across re-renders
  // This prevents cache loss and ensures queries maintain their state
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Refetch on mount if data is stale (safety net for iOS navigation issues)
            refetchOnMount: true,
            // Keep stale time short to ensure fresh data
            staleTime: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
