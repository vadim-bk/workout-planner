import { useQuery } from '@tanstack/react-query';
import { where, orderBy, limit } from 'firebase/firestore';
import type { WeeklyPlan } from '@/types';
import { getCollectionDocs } from '@/lib/firebase';
import { queryKeys } from '@/shared/api';

export const useCurrentPlan = (userId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.currentPlan(userId || ''),
    queryFn: async (): Promise<WeeklyPlan | null> => {
      if (!userId) return null;

      const snapshot = await getCollectionDocs(
        'workout_plans',
        where('userId', '==', userId),
        orderBy('weekStartDate', 'desc'),
        limit(1)
      );

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];

      return {
        id: doc.id,
        ...doc.data(),
        weekStartDate: doc.data().weekStartDate.toDate(),
        weekEndDate: doc.data().weekEndDate.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      } as WeeklyPlan;
    },
    enabled: !!userId,
  });
};
