import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from './msw-handlers';
import type * as firebaseAuth from 'firebase/auth';

global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterAll(() => {
  server.close();
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
