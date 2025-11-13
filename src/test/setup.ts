import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from './msw-handlers';
import type * as firebaseAuth from 'firebase/auth';

global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

const originalStderrWrite = process.stderr.write.bind(process.stderr);
const originalError = console.error;

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });

  process.stderr.write = (chunk: string | Uint8Array, encoding?: unknown, cb?: unknown) => {
    const message = typeof chunk === 'string' ? chunk : chunk.toString();
    if (message.includes('useAuth must be used within an AuthProvider')) {
      return true;
    }
    return originalStderrWrite(chunk, encoding as BufferEncoding, cb as () => void);
  };

  console.error = (...args: unknown[]) => {
    const firstArg = args[0];
    if (
      (typeof firstArg === 'string' && firstArg.includes('useAuth must be used within an AuthProvider')) ||
      (firstArg instanceof Error && firstArg.message === 'useAuth must be used within an AuthProvider') ||
      (typeof firstArg === 'object' &&
        firstArg !== null &&
        'message' in firstArg &&
        typeof firstArg.message === 'string' &&
        firstArg.message.includes('useAuth must be used within an AuthProvider'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  server.close();
  process.stderr.write = originalStderrWrite;
  console.error = originalError;
});

vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual<typeof firebaseAuth>('firebase/auth');
  return {
    ...actual,
    onAuthStateChanged: vi.fn((_, callback) => {
      callback(null);
      return vi.fn();
    }),
  };
});

afterEach(() => {
  server.resetHandlers();
});
