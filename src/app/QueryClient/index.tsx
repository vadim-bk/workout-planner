import { QueryClient as TanStackQueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

const queryClient = new TanStackQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }

        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

export const QueryClient = ({ children }: PropsWithChildren) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
