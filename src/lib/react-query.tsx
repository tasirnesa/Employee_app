import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const withQueryClient = (children: React.ReactNode) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

export { queryClient };


