import { screen, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { useCurrentPlan } from '../../api/useCurrentPlan';
import { DashboardPage } from './index';
import type { WeeklyPlan } from '@/types';
import { createWeeklyPlan } from '@/test/mock';
import { renderPage } from '@/test/utils';

vi.mock('../../api/useCurrentPlan');

type Args = {
  data?: WeeklyPlan | null;
  isLoading?: boolean;
  error?: Error | null;
};

const render = ({ data = null, isLoading = false, error = null }: Args = {}) => {
  vi.mocked(useCurrentPlan).mockReturnValue({
    data,
    isLoading,
    error,
  } as unknown as ReturnType<typeof useCurrentPlan>);

  renderPage(<DashboardPage />);
};

it('renders loading state', () => {
  render({ isLoading: true });
  expect(screen.getByText(/Головна/i)).toBeInTheDocument();
});

it('displays current plan when available', async () => {
  render({ data: createWeeklyPlan() });

  await waitFor(() => {
    expect(screen.getByText(/Поточний план тренувань/i)).toBeInTheDocument();
    expect(screen.getByText(/День 1/i)).toBeInTheDocument();
  });
});

it('shows empty state when no plan', async () => {
  render();

  await waitFor(() => {
    expect(screen.getByText(/Немає активних планів/i)).toBeInTheDocument();
  });
});

it('handles error states', async () => {
  const error = new Error('Failed to load plan');
  render({ error });

  await waitFor(() => {
    expect(screen.getByText(/Помилка завантаження плану/i)).toBeInTheDocument();
  });
});

it('displays link to new plan page', () => {
  render();

  const link = screen.getByRole('link', { name: /Додати новий план|Новий план/i });
  expect(link).toHaveAttribute('href', '/new-plan');
});
