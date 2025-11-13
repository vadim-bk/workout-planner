import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import type { WorkoutHistory } from '@/types';
import { updateDocument } from '@/lib/firebase';
import { queryKeys } from '@/shared/api';

export const useUpdateWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...workout }: WorkoutHistory) => {
      await updateDocument('workout_history', id, {
        ...workout,
        date: Timestamp.fromDate(workout.date),
      });

      return { id, ...workout };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workoutHistory(data.userId),
      });
    },
  });
};
