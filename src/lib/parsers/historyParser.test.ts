import { describe, it, expect } from 'vitest';
import { parseHistoryWorkouts, getImportExample, formatHistoryWorkout } from './historyParser';

describe('parseHistoryWorkouts', () => {
  it('should parse a simple workout history', () => {
    const text = `Тиждень: 25.08.2024 - 31.08.2024

День 1
1. Присідання зі штангою – 3×8-12
100 кг × 12
100 кг × 10
100 кг × 8`;

    const result = parseHistoryWorkouts(text);

    expect(result).toHaveLength(1);
    expect(result[0].dayNumber).toBe(1);
    expect(result[0].exercises).toHaveLength(1);
    expect(result[0].exercises[0].name).toBe('Присідання зі штангою');
    expect(result[0].exercises[0].sets).toHaveLength(3);
    expect(result[0].exercises[0].sets[0]).toEqual({ setNumber: 1, weight: 100, reps: 12 });
    expect(result[0].exercises[0].sets[1]).toEqual({ setNumber: 2, weight: 100, reps: 10 });
    expect(result[0].exercises[0].sets[2]).toEqual({ setNumber: 3, weight: 100, reps: 8 });
  });

  it('should parse multiple exercises', () => {
    const text = `Тиждень: 25.08.2024 - 31.08.2024

День 1
1. Присідання зі штангою – 3×8-12
100 кг × 12
100 кг × 10
100 кг × 8

2. Жим ногами – 3×10-15
150 кг × 15
150 кг × 12`;

    const result = parseHistoryWorkouts(text);

    expect(result[0].exercises).toHaveLength(2);
    expect(result[0].exercises[0].name).toBe('Присідання зі штангою');
    expect(result[0].exercises[1].name).toBe('Жим ногами');
  });

  it('should parse multiple days', () => {
    const text = `Тиждень: 25.08.2024 - 31.08.2024

День 1
1. Присідання зі штангою – 3×8-12
100 кг × 12

День 2
1. Жим штанги лежачи – 3×8-12
80 кг × 12`;

    const result = parseHistoryWorkouts(text);

    expect(result).toHaveLength(2);
    expect(result[0].dayNumber).toBe(1);
    expect(result[1].dayNumber).toBe(2);
  });

  it('should parse exercises without weight', () => {
    const text = `Тиждень: 25.08.2024 - 31.08.2024

День 1
1. Віджимання від підлоги – 3×макс
20
18
15`;

    const result = parseHistoryWorkouts(text);

    expect(result[0].exercises[0].sets[0].weight).toBe(0);
    expect(result[0].exercises[0].sets[0].reps).toBe(20);
  });

  it('should handle different date formats', () => {
    const text = `Тиждень: 25-08-2024 - 31-08-2024

День 1
1. Присідання зі штангою – 3×8-12
100 кг × 12`;

    const result = parseHistoryWorkouts(text);
    expect(result).toHaveLength(1);
  });

  it('should throw error for invalid format', () => {
    const text = 'Invalid text without week format';

    expect(() => parseHistoryWorkouts(text)).toThrow('Не знайдено тижнів');
  });

  it('should parse multiple weeks', () => {
    const text = `Тиждень: 25.08.2024 - 31.08.2024

День 1
1. Присідання зі штангою – 3×8-12
100 кг × 12

Тиждень: 01.09.2024 - 07.09.2024

День 1
1. Присідання зі штангою – 3×8-12
105 кг × 12`;

    const result = parseHistoryWorkouts(text);
    expect(result).toHaveLength(2);
  });
});

describe('getImportExample', () => {
  it('should return a non-empty example string', () => {
    const example = getImportExample();
    expect(example).toBeTruthy();
    expect(typeof example).toBe('string');
    expect(example.length).toBeGreaterThan(0);
  });

  it('should contain week format', () => {
    const example = getImportExample();
    expect(example).toMatch(/Тиждень:/);
  });

  it('should contain day markers', () => {
    const example = getImportExample();
    expect(example).toMatch(/День \d+/);
  });
});

describe('formatHistoryWorkout', () => {
  it('formats workout with exercises and sets', () => {
    const workout = parseHistoryWorkouts(
      `Тиждень: 25.08.2024 - 31.08.2024

День 1
1. Присідання зі штангою – 3×8-12
100 кг × 12
100 кг × 10`
    )[0];

    const result = formatHistoryWorkout(workout);

    expect(result).toContain('Присідання зі штангою');
    expect(result).toContain('100 кг × 12');
    expect(result).toContain('100 кг × 10');
    expect(result).toContain('День 1');
  });

  it('formats workout with exercises without weight', () => {
    const workout = parseHistoryWorkouts(
      `Тиждень: 25.08.2024 - 31.08.2024

День 1
1. Віджимання від підлоги – 3×макс
20
18`
    )[0];

    const result = formatHistoryWorkout(workout);

    expect(result).toContain('Віджимання від підлоги');
    expect(result).toContain('20');
    expect(result).toContain('18');
    expect(result).not.toContain('кг ×');
  });

  it('formats multiple exercises', () => {
    const workout = parseHistoryWorkouts(
      `Тиждень: 25.08.2024 - 31.08.2024

День 1
1. Присідання зі штангою – 3×8-12
100 кг × 12

2. Жим ногами – 3×10-15
150 кг × 15`
    )[0];

    const result = formatHistoryWorkout(workout);

    expect(result).toContain('1. Присідання зі штангою');
    expect(result).toContain('2. Жим ногами');
  });
});
