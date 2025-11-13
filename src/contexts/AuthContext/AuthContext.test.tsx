import { render, screen, waitFor } from '@testing-library/react';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '.';
import { auth, googleProvider } from '@/lib/firebase/config';
import { ErrorBoundary } from '@/shared/ui/error-boundary';

const originalError = console.error;

vi.mock('@/lib/firebase/config', () => ({
  auth: {},
  googleProvider: {},
}));

vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  return {
    ...actual,
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
  };
});

const TestComponent = () => {
  const { user, isLoading, signInWithGoogle, signOut } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button onClick={signInWithGoogle} data-testid="sign-in">
        Sign In
      </button>
      <button onClick={signOut} data-testid="sign-out">
        Sign Out
      </button>
    </div>
  );
};

let unsubscribe: () => void;

beforeEach(() => {
  vi.clearAllMocks();
  unsubscribe = vi.fn();
  vi.mocked(onAuthStateChanged).mockImplementation((_authInstance, callback) => {
    if (typeof callback === 'function') {
      callback(null);
    }
    return unsubscribe;
  });
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

it('provides auth context and initializes loading state', async () => {
  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
  });
});

it('handles sign in with Google', async () => {
  const mockSignIn = vi.mocked(signInWithPopup);
  // @ts-expect-error - Mock UserCredential object for testing
  mockSignIn.mockResolvedValue({});

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

  const signInButton = screen.getByTestId('sign-in');
  signInButton.click();

  await waitFor(() => {
    expect(mockSignIn).toHaveBeenCalledWith(auth, googleProvider);
  });
});

it('handles sign out', async () => {
  const mockSignOut = vi.mocked(firebaseSignOut);
  mockSignOut.mockResolvedValue(undefined);

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

  const signOutButton = screen.getByTestId('sign-out');
  signOutButton.click();

  await waitFor(() => {
    expect(mockSignOut).toHaveBeenCalled();
  });
});

it('throws error when useAuth is used outside provider', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  render(
    <ErrorBoundary
      fallback={
        <div data-testid="error-boundary">
          <div data-testid="error-message">Error caught</div>
        </div>
      }
    >
      <TestComponent />
    </ErrorBoundary>
  );

  expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  expect(screen.queryByTestId('user')).not.toBeInTheDocument();
  expect(screen.getByTestId('error-boundary')).toBeInTheDocument();

  consoleErrorSpy.mockRestore();
  consoleWarnSpy.mockRestore();
});
