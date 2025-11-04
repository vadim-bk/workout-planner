import { useQuery } from '@tanstack/react-query';
import { where, orderBy } from 'firebase/firestore';
import type { WorkoutHistory } from '@/types';
import { getCollectionDocs } from '@/lib/firebase';
import { queryKeys } from '@/shared/api';

export const useWorkoutHistory = (userId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.workoutHistory(userId || ''),
    queryFn: async (): Promise<WorkoutHistory[]> => {
      if (!userId) return [];

      const snapshot = await getCollectionDocs(
        'workout_history',
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        date: doc.data().date.toDate(),
      })) as WorkoutHistory[];
    },
    enabled: !!userId,
  });
};
