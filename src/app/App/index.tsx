import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppRouter } from '../AppRouter';
import { QueryClient } from '../QueryClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/shared/ui';

export const App = () => {
  return (
    <ErrorBoundary>
      <QueryClient>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClient>
    </ErrorBoundary>
  );
};
