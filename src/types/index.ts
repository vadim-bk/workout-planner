export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string; // "6-10" or "8-12"
  type?: 'superset' | 'dropset' | 'normal';
  notes?: string;
}

export interface DayWorkout {
  day: number;
  exercises: Exercise[];
}

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  days: DayWorkout[];
  rawText: string;
  createdAt: Date;
}

export interface ExerciseSet {
  setNumber: number;
  weight: number;
  reps: number;
}

export interface CompletedExercise {
  exerciseId: string;
  name: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface WorkoutHistory {
  id: string;
  userId: string;
  date: Date;
  dayNumber: number;
  weekPlanId: string;
  exercises: CompletedExercise[];
}

export interface AISuggestion {
  id: string;
  userId: string;
  weekPlanId: string;
  exerciseName: string;
  suggestedWeights: number[];
  suggestedReps: number[];
  reasoning?: string;
  createdAt: Date;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
