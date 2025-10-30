import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppRouter } from '../AppRouter';
import { QueryClient } from '../QueryClient';
import { AuthProvider } from '@/contexts/AuthContext';

export const App = () => {
  return (
    <QueryClient>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClient>
  );
};
