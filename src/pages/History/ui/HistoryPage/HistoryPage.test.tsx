import { screen, waitFor } from '@testing-library/react';
import user from '@testing-library/user-event';
import { it, expect, vi } from 'vitest';
import { HistoryPage } from './index';
import type { WorkoutHistory } from '@/types';
import { useWorkoutHistory } from '@/entities/workoutHistory';
import { createWorkoutHistory } from '@/test/mock';
import { renderPage } from '@/test/utils';

vi.mock('@/entities/workoutHistory');

const mockHistory = [
  createWorkoutHistory({
    date: new Date(2024, 0, 15),
    dayNumber: 1,
    exercises: [
      {
        exerciseId: '1',
        name: 'Присідання зі штангою',
        sets: [
          { setNumber: 1, weight: 100, reps: 12 },
          { setNumber: 2, weight: 100, reps: 10 },
        ],
      },
    ],
  }),
];

type Args = {
  data?: WorkoutHistory[];
  isLoading?: boolean;
  error?: Error | null;
};

const render = ({ data = [], isLoading = false, error = null }: Args = {}) => {
  vi.mocked(useWorkoutHistory).mockReturnValue({
    data: data,
    isLoading: isLoading,
    error: error,
  } as unknown as ReturnType<typeof useWorkoutHistory>);

  renderPage(<HistoryPage />);
};

it('displays empty state when no history', async () => {
  render();

  await waitFor(() => {
    expect(screen.getByText(/Немає історії/i)).toBeInTheDocument();
  });
});

it('renders workout history grouped by weeks', async () => {
  render({ data: mockHistory });

  await waitFor(() => {
    expect(screen.getByText(/Історія тренувань/i)).toBeInTheDocument();
    expect(screen.getByText(/Тренування по тижнях/i)).toBeInTheDocument();
  });
});

it('displays exercise selection buttons', async () => {
  render({ data: mockHistory });

  await waitFor(() => {
    expect(screen.getByText(/Виберіть вправу для графіку/i)).toBeInTheDocument();
    expect(screen.getByText(/Присідання зі штангою/i)).toBeInTheDocument();
  });
});

it('shows chart when exercise is selected', async () => {
  render({ data: mockHistory });

  await waitFor(() => {
    const exerciseButton = screen.getByText(/Присідання зі штангою/i);
    expect(exerciseButton).toBeInTheDocument();
  });

  const exerciseButton = screen.getByText(/Присідання зі штангою/i);
  await user.click(exerciseButton);

  await waitFor(() => {
    expect(screen.getByText(/Прогрес:/i)).toBeInTheDocument();
  });
});

it('handles loading state', () => {
  render({ isLoading: true });

  expect(screen.queryByText(/Історія тренувань/i)).not.toBeInTheDocument();
});

it('handles error state', async () => {
  const error = new Error('Failed to load history');
  render({ error });

  await waitFor(() => {
    expect(screen.getByText(/Помилка завантаження історії/i)).toBeInTheDocument();
  });
});
