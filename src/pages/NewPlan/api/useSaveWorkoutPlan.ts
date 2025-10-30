import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import type { WeeklyPlan } from '@/types';
import { addDocument } from '@/lib/firebase';
import { queryKeys } from '@/shared/api';

export const useSaveWorkoutPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: Omit<WeeklyPlan, 'id'>) => {
      const docRef = await addDocument('workout_plans', {
        ...plan,
        weekStartDate: Timestamp.fromDate(plan.weekStartDate),
        weekEndDate: Timestamp.fromDate(plan.weekEndDate),
        createdAt: Timestamp.fromDate(plan.createdAt),
      });

      return { ...plan, id: docRef.id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.currentPlan(data.userId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.workoutPlans });
    },
  });
};
