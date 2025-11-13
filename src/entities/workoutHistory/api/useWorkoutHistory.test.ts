import { renderHook } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { it, expect, vi, beforeEach } from 'vitest';
import { useWorkoutHistory } from './useWorkoutHistory';
import { getCollectionDocs } from '@/lib/firebase';
import { queryKeys } from '@/shared/api';
import { createWorkoutHistory } from '@/test/mock';

vi.mock('@/lib/firebase', () => ({
  getCollectionDocs: vi.fn(),
}));

const mockUseQuery = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => mockUseQuery(options),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it('fetches and transforms workout history when userId is provided', async () => {
  const userId = 'user-123';

  const mockHistory1 = createWorkoutHistory({ id: 'workout-1', userId, date: new Date('2024-01-15') });
  const mockHistory2 = createWorkoutHistory({ id: 'workout-2', userId, date: new Date('2024-01-10') });

  const mockSnapshot = {
    docs: [
      {
        id: 'workout-1',
        data: () => ({
          ...mockHistory1,
          date: Timestamp.fromDate(mockHistory1.date),
        }),
      },
      {
        id: 'workout-2',
        data: () => ({
          ...mockHistory2,
          date: Timestamp.fromDate(mockHistory2.date),
        }),
      },
    ],
  };

  vi.mocked(getCollectionDocs).mockResolvedValue(mockSnapshot as never);

  mockUseQuery.mockImplementation((options) => {
    if (options.enabled) {
      return {
        data: undefined,
        isLoading: true,
        isSuccess: false,
      };
    }
    return {
      data: undefined,
      isLoading: false,
      isSuccess: false,
      fetchStatus: 'idle' as const,
    };
  });

  renderHook(() => useWorkoutHistory(userId));

  expect(mockUseQuery).toHaveBeenCalledWith(
    expect.objectContaining({
      queryKey: queryKeys.workoutHistory(userId),
      enabled: true,
    })
  );

  const queryFn = mockUseQuery.mock.calls[0][0].queryFn;
  const result = await queryFn();

  expect(result).toHaveLength(2);
  expect(result[0].id).toBe('workout-1');
  expect(result[0].date).toEqual(new Date('2024-01-15'));
  expect(result[1].id).toBe('workout-2');
  expect(result[1].date).toEqual(new Date('2024-01-10'));
  expect(getCollectionDocs).toHaveBeenCalledWith('workout_history', expect.anything(), expect.anything());
});

it('disables query and does not fetch when userId is undefined', () => {
  mockUseQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isSuccess: false,
    fetchStatus: 'idle' as const,
  });

  renderHook(() => useWorkoutHistory(undefined));

  expect(mockUseQuery).toHaveBeenCalledWith(
    expect.objectContaining({
      queryKey: queryKeys.workoutHistory(''),
      enabled: false,
    })
  );
  expect(getCollectionDocs).not.toHaveBeenCalled();
});
