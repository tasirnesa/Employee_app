import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SocketProvider } from '../context/SocketContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const withQueryClient = (children: React.ReactNode) => (
  <QueryClientProvider client={queryClient}>
    <SocketProvider>
      {children}
    </SocketProvider>
  </QueryClientProvider>
);

export { queryClient };


