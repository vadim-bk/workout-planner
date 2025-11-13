import { describe, it, expect } from 'vitest';
import { parseWorkoutPlan, formatExerciseForDisplay } from './workoutParser';
import type { Exercise } from '@/types';

describe('parseWorkoutPlan', () => {
  it('should parse a simple workout plan with one day', () => {
    const text = `День 1
1. Присідання зі штангою
3 підходи по 8-12`;

    const result = parseWorkoutPlan(text);

    expect(result).toHaveLength(1);
    expect(result[0].day).toBe(1);
    expect(result[0].exercises).toHaveLength(1);
    expect(result[0].exercises[0].name).toBe('Присідання зі штангою');
    expect(result[0].exercises[0].sets).toBe(3);
    expect(result[0].exercises[0].reps).toMatch(/[\d-]+/);
  });

  it('should parse multiple days', () => {
    const text = `День 1
1. Присідання зі штангою
3 підходи по 8-12

День 2
1. Жим штанги лежачи
4 підходи по 6-10`;

    const result = parseWorkoutPlan(text);

    expect(result).toHaveLength(2);
    expect(result[0].day).toBe(1);
    expect(result[1].day).toBe(2);
  });

  it('should parse multiple exercises per day', () => {
    const text = `День 1
1. Присідання зі штангою
3 підходи по 8-12

2. Жим ногами
3 підходи по 10-15`;

    const result = parseWorkoutPlan(text);

    expect(result[0].exercises).toHaveLength(2);
    expect(result[0].exercises[0].name).toBe('Присідання зі штангою');
    expect(result[0].exercises[1].name).toBe('Жим ногами');
  });

  it('should detect superset exercises', () => {
    const text = `День 1
1. Присідання зі штангою
Суперсет 3 підходи по 8-12`;

    const result = parseWorkoutPlan(text);

    expect(result[0].exercises[0].type).toBe('superset');
  });

  it('should detect dropset exercises', () => {
    const text = `День 1
1. Присідання зі штангою
Дропсет 3 підходи по 8-12`;

    const result = parseWorkoutPlan(text);

    expect(result[0].exercises[0].type).toBe('dropset');
  });

  it('should handle empty text', () => {
    const result = parseWorkoutPlan('');
    expect(result).toHaveLength(0);
  });

  it('should handle text without day markers', () => {
    const text = 'Some random text without day markers';
    const result = parseWorkoutPlan(text);
    expect(result).toHaveLength(0);
  });

  it('should handle Windows line endings', () => {
    const text = `День 1\r\n1. Присідання зі штангою\r\n3 підходи по 8-12`;
    const result = parseWorkoutPlan(text);
    expect(result).toHaveLength(1);
    expect(result[0].exercises).toHaveLength(1);
  });
});

describe('formatExerciseForDisplay', () => {
  it('should format normal exercise', () => {
    const exercise: Exercise = {
      id: '1',
      name: 'Присідання зі штангою',
      sets: 3,
      reps: '8-12',
      type: 'normal',
    };

    const result = formatExerciseForDisplay(exercise);

    expect(result).toContain('Присідання зі штангою');
    expect(result).toContain('3 підходи по 8-12');
  });

  it('should format superset exercise', () => {
    const exercise: Exercise = {
      id: '1',
      name: 'Присідання зі штангою',
      sets: 3,
      reps: '8-12',
      type: 'superset',
    };

    const result = formatExerciseForDisplay(exercise);

    expect(result).toContain('Суперсет');
    expect(result).toContain('Присідання зі штангою');
  });

  it('should format dropset exercise', () => {
    const exercise: Exercise = {
      id: '1',
      name: 'Присідання зі штангою',
      sets: 3,
      reps: '8-12',
      type: 'dropset',
    };

    const result = formatExerciseForDisplay(exercise);

    expect(result).toContain('Дропсет');
    expect(result).toContain('Присідання зі штангою');
  });
});
