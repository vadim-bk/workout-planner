import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import type { WorkoutHistory } from '@/types';
import { addDocument } from '@/lib/firebase/config';
import { queryKeys } from '@/shared/api';

export const useSaveWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workout: Omit<WorkoutHistory, 'id'>) => {
      const docRef = await addDocument('workout_history', {
        ...workout,
        date: Timestamp.fromDate(workout.date),
      });

      return { ...workout, id: docRef.id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workoutHistory(data.userId),
      });
    },
  });
};
