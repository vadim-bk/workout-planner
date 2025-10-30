import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import type { AISuggestion } from '@/types';
import { addDocument } from '@/lib/firebase';
import { queryKeys } from '@/shared/api';

export const useSaveAISuggestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestions: AISuggestion[]) => {
      const savePromises = suggestions.map((suggestion) =>
        addDocument('ai_suggestions', {
          ...suggestion,
          createdAt: Timestamp.fromDate(suggestion.createdAt),
        })
      );

      await Promise.all(savePromises);
      return suggestions;
    },
    onSuccess: (data) => {
      if (data.length > 0) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.aiSuggestions(data[0].userId, data[0].weekPlanId),
        });
      }
    },
  });
};
