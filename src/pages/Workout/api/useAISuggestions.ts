import { useQuery } from '@tanstack/react-query';
import { where } from 'firebase/firestore';
import type { AISuggestion } from '@/types';
import { getCollectionDocs } from '@/lib/firebase';
import { queryKeys } from '@/shared/api';

export const useAISuggestions = (userId: string | undefined, weekPlanId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.aiSuggestions(userId || '', weekPlanId || ''),
    queryFn: async (): Promise<Map<string, AISuggestion>> => {
      if (!userId || !weekPlanId) return new Map();

      const snapshot = await getCollectionDocs(
        'ai_suggestions',
        where('userId', '==', userId),
        where('weekPlanId', '==', weekPlanId)
      );
      const suggestionsMap = new Map<string, AISuggestion>();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        suggestionsMap.set(data.exerciseName, {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as AISuggestion);
      });

      return suggestionsMap;
    },
    enabled: !!userId && !!weekPlanId,
  });
};
