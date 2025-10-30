import { useMutation } from '@tanstack/react-query';
import type { WeeklyPlan, WorkoutHistory } from '@/types';
import { generateWeightSuggestions } from '@/lib/openai/suggestions';

export const useGenerateWeightSuggestions = () => {
  return useMutation({
    mutationFn: async ({ newPlan, workoutHistory }: { newPlan: WeeklyPlan; workoutHistory: WorkoutHistory[] }) => {
      return await generateWeightSuggestions(newPlan, workoutHistory);
    },
    retry: (failureCount: number, error: Error) => {
      if (error instanceof Error && error.message.includes('rate limit')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};
