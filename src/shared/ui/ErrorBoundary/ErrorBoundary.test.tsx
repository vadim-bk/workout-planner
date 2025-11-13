import { render as rtlRender, screen } from '@testing-library/react';
import user from '@testing-library/user-event';
import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '.';
import type { ReactNode } from 'react';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

type Args = {
  fallback?: ReactNode;
  shouldThrow?: boolean;
};

const render = ({ fallback, shouldThrow = false }: Args = {}) => {
  rtlRender(
    <ErrorBoundary fallback={fallback}>
      <ThrowError shouldThrow={shouldThrow} />
    </ErrorBoundary>
  );
};

const originalError = console.error;
const originalStderrWrite = process.stderr.write.bind(process.stderr);

beforeEach(() => {
  console.error = vi.fn();
  process.stderr.write = vi.fn((chunk: string | Uint8Array) => {
    const message = typeof chunk === 'string' ? chunk : chunk.toString();
    if (message.includes('Test error')) {
      return true;
    }
    return originalStderrWrite(chunk);
  });
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { reload: vi.fn() },
  });
});

afterEach(() => {
  console.error = originalError;
  process.stderr.write = originalStderrWrite;
  vi.restoreAllMocks();
});

it('renders children when there is no error', () => {
  render();
  expect(screen.getByText('No error')).toBeInTheDocument();
});

it('catches error and displays error message', () => {
  render({ shouldThrow: true });

  expect(screen.getByText(/Щось пішло не так/i)).toBeInTheDocument();
  const errorMessages = screen.getAllByText(/Test error/i);
  expect(errorMessages.length).toBeGreaterThan(0);
});

it('displays custom fallback when provided', () => {
  const fallback = <div>Custom error fallback</div>;
  render({ fallback, shouldThrow: true });

  expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
});

it('resets error state when reset button is clicked', async () => {
  render({ shouldThrow: true });
  expect(screen.getByText(/Щось пішло не так/i)).toBeInTheDocument();

  const resetButton = screen.getByRole('button', { name: /Спробувати ще раз/i });
  await user.click(resetButton);

  render({ shouldThrow: false });
  expect(screen.getByText('No error')).toBeInTheDocument();
});

it('reloads page when reload button is clicked', async () => {
  render({ shouldThrow: true });

  const reloadButton = screen.getByRole('button', { name: /Перезавантажити сторінку/i });
  await user.click(reloadButton);

  expect(window.location.reload).toHaveBeenCalled();
});

it('logs error to console', () => {
  render({ shouldThrow: true });
  expect(console.error).toHaveBeenCalled();
});
