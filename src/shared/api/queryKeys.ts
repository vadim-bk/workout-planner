export const queryKeys = {
  workoutPlans: ['workoutPlans'] as const,
  workoutPlan: (id: string) => ['workoutPlan', id] as const,
  currentPlan: (userId: string) => ['currentPlan', userId] as const,
  workoutHistory: (userId: string) => ['workoutHistory', userId] as const,
  aiSuggestions: (userId: string, weekPlanId: string) => ['aiSuggestions', userId, weekPlanId] as const,
} as const;
