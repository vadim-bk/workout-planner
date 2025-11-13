import { it, expect } from 'vitest';
import { queryKeys } from './queryKeys';

it('generates workoutPlans key', () => {
  const key = queryKeys.workoutPlans;
  expect(key).toEqual(['workoutPlans']);
});

it('generates workoutPlan key with id', () => {
  const key = queryKeys.workoutPlan('plan-123');
  expect(key).toEqual(['workoutPlan', 'plan-123']);
});

it('generates currentPlan key with userId', () => {
  const key = queryKeys.currentPlan('user-456');
  expect(key).toEqual(['currentPlan', 'user-456']);
});

it('generates workoutHistory key with userId', () => {
  const key = queryKeys.workoutHistory('user-789');
  expect(key).toEqual(['workoutHistory', 'user-789']);
});

it('generates aiSuggestions key with userId and weekPlanId', () => {
  const key = queryKeys.aiSuggestions('user-123', 'plan-456');
  expect(key).toEqual(['aiSuggestions', 'user-123', 'plan-456']);
});
