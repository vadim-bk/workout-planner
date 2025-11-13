import type { AISuggestion, CompletedExercise, DayWorkout, Exercise, WeeklyPlan, WorkoutHistory } from '@/types';

const createExercise = (overrides?: Partial<Exercise>): Exercise => ({
  id: `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Присідання зі штангою',
  sets: 3,
  reps: '8-12',
  type: 'normal',
  notes: '3 підходи по 8-12',
  ...overrides,
});

export const createDayWorkout = (day: number, exercises?: Exercise[]): DayWorkout => ({
  day,
  exercises: exercises || [createExercise()],
});

export const createWeeklyPlan = (overrides?: Partial<WeeklyPlan>): WeeklyPlan => {
  const now = new Date();

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    id: `plan-${Date.now()}`,
    userId: 'test-user-123',
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    days: [createDayWorkout(1), createDayWorkout(2)],
    rawText: 'День 1\n1. Присідання зі штангою\n3 підходи по 8-12',
    createdAt: now,
    ...overrides,
  };
};

export const createCompletedExercise = (overrides?: Partial<CompletedExercise>): CompletedExercise => ({
  exerciseId: `exercise-${Date.now()}`,
  name: 'Присідання зі штангою',
  sets: [
    { setNumber: 1, weight: 100, reps: 12 },
    { setNumber: 2, weight: 100, reps: 10 },
    { setNumber: 3, weight: 100, reps: 8 },
  ],
  ...overrides,
});

export const createWorkoutHistory = (overrides?: Partial<WorkoutHistory>): WorkoutHistory => ({
  id: `workout-${Date.now()}`,
  userId: 'test-user-123',
  date: new Date(),
  dayNumber: 1,
  weekPlanId: `plan-${Date.now()}`,
  exercises: [createCompletedExercise()],
  ...overrides,
});

export const createAISuggestion = (overrides?: Partial<AISuggestion>): AISuggestion => ({
  id: `suggestion-${Date.now()}`,
  userId: 'test-user-123',
  weekPlanId: `plan-${Date.now()}`,
  exerciseName: 'Присідання зі штангою',
  suggestedWeights: [100, 105, 110],
  suggestedReps: [15, 12, 10],
  reasoning: 'На основі історії тренувань',
  createdAt: new Date(),
  ...overrides,
});
