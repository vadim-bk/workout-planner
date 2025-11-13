import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateWeightSuggestions, formatWorkoutHistory, formatNewPlan } from './suggestions';
import type { WorkoutHistory } from '@/types';
import { createWeeklyPlan, createWorkoutHistory } from '@/test/mock';

const mockOpenAIClient = {
  chat: {
    completions: {
      create: vi.fn(),
    },
  },
};

vi.mock('openai', () => {
  class MockOpenAI {
    constructor() {
      return mockOpenAIClient;
    }
  }
  return {
    default: MockOpenAI,
  };
});

describe('generateWeightSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_OPENAI_API_KEY', 'test-api-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('throws error when API key is not configured', async () => {
    vi.stubEnv('VITE_OPENAI_API_KEY', '');
    vi.resetModules();
    const newPlan = createWeeklyPlan();
    const history: WorkoutHistory[] = [];

    await expect(generateWeightSuggestions(newPlan, history)).rejects.toThrow('OpenAI API key is not configured');
  });

  it('generates suggestions successfully', async () => {
    const newPlan = createWeeklyPlan();
    const history: WorkoutHistory[] = [];
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              suggestions: [
                {
                  exerciseName: 'Присідання зі штангою',
                  suggestedWeights: [100, 105, 110],
                  suggestedReps: [15, 12, 10],
                  reasoning: 'Test reasoning',
                },
              ],
            }),
          },
        },
      ],
    };

    mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse as any);

    const suggestions = await generateWeightSuggestions(newPlan, history);

    expect(suggestions.size).toBe(1);
    expect(suggestions.get('Присідання зі штангою')).toBeDefined();
    const suggestion = suggestions.get('Присідання зі штангою');
    expect(suggestion?.suggestedWeights).toEqual([100, 105, 110]);
    expect(suggestion?.suggestedReps).toEqual([15, 12, 10]);
    expect(suggestion?.reasoning).toBe('Test reasoning');
  });

  it('handles invalid JSON response', async () => {
    const newPlan = createWeeklyPlan();
    const history: WorkoutHistory[] = [];
    const mockResponse = {
      choices: [
        {
          message: {
            content: 'invalid json',
          },
        },
      ],
    };

    mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse as any);

    await expect(generateWeightSuggestions(newPlan, history)).rejects.toThrow('Invalid JSON response from OpenAI');
  });

  it('handles missing response content', async () => {
    const newPlan = createWeeklyPlan();
    const history: WorkoutHistory[] = [];
    const mockResponse = {
      choices: [{}],
    };

    mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse as any);

    await expect(generateWeightSuggestions(newPlan, history)).rejects.toThrow('No response from OpenAI');
  });

  it('filters invalid suggestions', async () => {
    const newPlan = createWeeklyPlan();
    const history: WorkoutHistory[] = [];
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              suggestions: [
                {
                  exerciseName: 'Valid Exercise',
                  suggestedWeights: [100, 105],
                  suggestedReps: [15, 12],
                  reasoning: 'Valid',
                },
                {
                  exerciseName: '',
                  suggestedWeights: [100],
                  suggestedReps: [15],
                },
                {},
              ],
            }),
          },
        },
      ],
    };

    mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse as any);

    const suggestions = await generateWeightSuggestions(newPlan, history);

    expect(suggestions.size).toBe(1);
    expect(suggestions.get('Valid Exercise')).toBeDefined();
  });

  it('handles API errors', async () => {
    const newPlan = createWeeklyPlan();
    const history: WorkoutHistory[] = [];

    mockOpenAIClient.chat.completions.create.mockRejectedValue(new Error('API Error'));

    await expect(generateWeightSuggestions(newPlan, history)).rejects.toThrow('API Error');
  });
});

describe('formatWorkoutHistory', () => {
  it('returns message when history is empty', () => {
    const history: WorkoutHistory[] = [];
    const result = formatWorkoutHistory(history);
    expect(result).toContain('Історія тренувань відсутня');
  });

  it('formats workout history with exercises', () => {
    const workout = createWorkoutHistory({
      date: new Date(),
      dayNumber: 1,
      exercises: [
        {
          exerciseId: 'ex1',
          name: 'Присідання зі штангою',
          sets: [
            { setNumber: 1, weight: 100, reps: 12 },
            { setNumber: 2, weight: 105, reps: 10 },
          ],
        },
      ],
    });
    const history: WorkoutHistory[] = [workout];
    const result = formatWorkoutHistory(history);

    expect(result).toContain('Присідання зі штангою');
    expect(result).toContain('100кг×12');
    expect(result).toContain('105кг×10');
  });

  it('filters workouts from last 2 months', () => {
    const oldWorkout = createWorkoutHistory({
      date: new Date('2020-01-01'),
      dayNumber: 1,
    });
    const recentWorkout = createWorkoutHistory({
      date: new Date(),
      dayNumber: 1,
    });
    const history: WorkoutHistory[] = [oldWorkout, recentWorkout];
    const result = formatWorkoutHistory(history);

    expect(result).toContain(recentWorkout.exercises[0].name);
    expect(result).not.toContain('2020');
  });

  it('shows progression analysis when multiple records exist', () => {
    const recentDate = new Date();
    const olderDate = new Date();
    olderDate.setDate(recentDate.getDate() - 1);

    const workout1 = createWorkoutHistory({
      date: olderDate,
      dayNumber: 1,
      exercises: [
        {
          exerciseId: 'ex1',
          name: 'Присідання зі штангою',
          sets: [{ setNumber: 1, weight: 100, reps: 12 }],
        },
      ],
    });
    const workout2 = createWorkoutHistory({
      date: recentDate,
      dayNumber: 1,
      exercises: [
        {
          exerciseId: 'ex1',
          name: 'Присідання зі штангою',
          sets: [{ setNumber: 1, weight: 110, reps: 12 }],
        },
      ],
    });
    const history: WorkoutHistory[] = [workout2, workout1];
    const result = formatWorkoutHistory(history);

    expect(result).toContain('ПРОГРЕСІЯ');
    expect(result).toContain('+10');
  });
});

describe('formatNewPlan', () => {
  it('formats weekly plan correctly', () => {
    const plan = createWeeklyPlan({
      weekStartDate: new Date('2024-01-15'),
      weekEndDate: new Date('2024-01-21'),
      days: [
        {
          day: 1,
          exercises: [
            {
              id: 'ex1',
              name: 'Присідання зі штангою',
              sets: 3,
              reps: '8-12',
              type: 'normal',
            },
          ],
        },
      ],
    });

    const result = formatNewPlan(plan);

    expect(result).toContain('Присідання зі штангою');
    expect(result).toContain('3 підходи по 8-12');
    expect(result).toContain('ДЕНЬ 1');
  });

  it('formats superset exercises', () => {
    const plan = createWeeklyPlan({
      days: [
        {
          day: 1,
          exercises: [
            {
              id: 'ex1',
              name: 'Суперсет вправа',
              sets: 3,
              reps: '8-12',
              type: 'superset',
            },
          ],
        },
      ],
    });

    const result = formatNewPlan(plan);

    expect(result).toContain('Суперсет');
  });

  it('formats dropset exercises', () => {
    const plan = createWeeklyPlan({
      days: [
        {
          day: 1,
          exercises: [
            {
              id: 'ex1',
              name: 'Дропсет вправа',
              sets: 4,
              reps: '10-15',
              type: 'dropset',
            },
          ],
        },
      ],
    });

    const result = formatNewPlan(plan);

    expect(result).toContain('Дропсет');
    expect(result).toContain('4 підходи');
  });

  it('formats multiple days', () => {
    const plan = createWeeklyPlan({
      days: [
        {
          day: 1,
          exercises: [
            {
              id: 'ex1',
              name: 'Вправа дня 1',
              sets: 3,
              reps: '8-12',
              type: 'normal',
            },
          ],
        },
        {
          day: 2,
          exercises: [
            {
              id: 'ex2',
              name: 'Вправа дня 2',
              sets: 4,
              reps: '10-15',
              type: 'normal',
            },
          ],
        },
      ],
    });

    const result = formatNewPlan(plan);

    expect(result).toContain('ДЕНЬ 1');
    expect(result).toContain('ДЕНЬ 2');
    expect(result).toContain('Вправа дня 1');
    expect(result).toContain('Вправа дня 2');
  });
});
