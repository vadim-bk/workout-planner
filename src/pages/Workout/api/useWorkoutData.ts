import { useQuery } from '@tanstack/react-query';
import { where } from 'firebase/firestore';
import type { WeeklyPlan, DayWorkout, WorkoutHistory } from '@/types';
import { getCollectionDocs, getDocument } from '@/lib/firebase/config';

export const useWorkoutData = (planId: string | undefined, day: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ['workoutData', planId, day, userId],
    queryFn: async (): Promise<{
      plan: WeeklyPlan;
      dayWorkout: DayWorkout;
      existingWorkout: WorkoutHistory | null;
    }> => {
      if (!planId || !day || !userId) {
        throw new Error('Missing required parameters');
      }

      const planDoc = await getDocument('workout_plans', planId);

      if (!planDoc.exists()) {
        throw new Error('Plan not found');
      }

      const plan: WeeklyPlan = {
        ...planDoc.data(),
        id: planDoc.id,
        weekStartDate: planDoc.data().weekStartDate.toDate(),
        weekEndDate: planDoc.data().weekEndDate.toDate(),
        createdAt: planDoc.data().createdAt.toDate(),
      } as WeeklyPlan;

      const currentDay = plan.days.find((d) => d.day === parseInt(day));
      if (!currentDay) {
        throw new Error('Day not found in plan');
      }

      const historySnapshot = await getCollectionDocs(
        'workout_history',
        where('userId', '==', userId),
        where('weekPlanId', '==', planId),
        where('dayNumber', '==', parseInt(day))
      );
      const existingWorkout = historySnapshot.empty
        ? null
        : ({
            ...historySnapshot.docs[0].data(),
            id: historySnapshot.docs[0].id,
            date: historySnapshot.docs[0].data().date.toDate(),
          } as WorkoutHistory);

      return {
        plan,
        dayWorkout: currentDay,
        existingWorkout,
      };
    },
    enabled: !!planId && !!day && !!userId,
  });
};
