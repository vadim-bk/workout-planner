import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import user from '@testing-library/user-event';
import { onAuthStateChanged } from 'firebase/auth';
import { it, expect, vi, beforeEach } from 'vitest';
import { useGenerateWeightSuggestions } from '../../api/useGenerateWeightSuggestions';
import { useSaveAISuggestions } from '../../api/useSaveAISuggestions';
import { useSaveWorkoutPlan } from '../../api/useSaveWorkoutPlan';
import { NewPlanPage } from './index';
import { useWorkoutHistory } from '@/entities/workoutHistory';
import { createUser } from '@/test/mock';
import { renderPage } from '@/test/utils';

vi.mock('../../api/useSaveWorkoutPlan');
vi.mock('../../api/useGenerateWeightSuggestions');
vi.mock('../../api/useSaveAISuggestions');
vi.mock('@/entities/workoutHistory');

const render = () => {
  renderPage(<NewPlanPage />);
};

const mockSavePlan = vi.fn();
const mockGenerateSuggestions = vi.fn();
const mockSaveSuggestions = vi.fn();

beforeEach(() => {
  vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    if (typeof callback === 'function') {
      callback(createUser() as never);
    }
    return vi.fn();
  });

  vi.mocked(useSaveWorkoutPlan).mockReturnValue({
    mutate: mockSavePlan,
    isPending: false,
  } as unknown as ReturnType<typeof useSaveWorkoutPlan>);

  vi.mocked(useGenerateWeightSuggestions).mockReturnValue({
    mutate: mockGenerateSuggestions,
    isPending: false,
  } as unknown as ReturnType<typeof useGenerateWeightSuggestions>);

  vi.mocked(useSaveAISuggestions).mockReturnValue({
    mutate: mockSaveSuggestions,
    isPending: false,
  } as unknown as ReturnType<typeof useSaveAISuggestions>);

  vi.mocked(useWorkoutHistory).mockReturnValue({
    data: [],
  } as unknown as ReturnType<typeof useWorkoutHistory>);
});

it('renders form fields', () => {
  render();

  expect(screen.getByText(/Початок тижня/i)).toBeInTheDocument();
  expect(screen.getByText(/Кінець тижня/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Текст плану/i).length).toBeGreaterThan(0);
  expect(screen.getByRole('textbox', { name: /Текст плану/i })).toBeInTheDocument();
});

it('parses workout plan from text input', async () => {
  render();

  const weekStartInput = screen.getByLabelText(/Початок тижня/i) as HTMLInputElement;
  const weekEndInput = screen.getByLabelText(/Кінець тижня/i) as HTMLInputElement;
  const textInput = screen.getByRole('textbox', { name: /Текст плану/i }) as HTMLTextAreaElement;
  const parseButton = screen.getByRole('button', { name: /Переглянути план/i });

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  act(() => {
    fireEvent.change(weekStartInput, { target: { value: weekStart.toISOString().split('T')[0] } });
    fireEvent.change(weekEndInput, { target: { value: weekEnd.toISOString().split('T')[0] } });
  });
  await user.type(
    textInput,
    `День 1
1. Присідання зі штангою
3 підходи по 8-12`
  );

  await waitFor(() => {
    expect(parseButton).not.toBeDisabled();
  });

  await user.click(parseButton);

  await waitFor(() => {
    expect(screen.getByText(/Розпізнаний план/i)).toBeInTheDocument();
    expect(screen.getByText(/Присідання зі штангою/i)).toBeInTheDocument();
  });
});

it('shows error for invalid plan text', async () => {
  render();

  const weekStartInput = screen.getByLabelText(/Початок тижня/i) as HTMLInputElement;
  const weekEndInput = screen.getByLabelText(/Кінець тижня/i) as HTMLInputElement;
  const textInput = screen.getByRole('textbox', { name: /Текст плану/i }) as HTMLTextAreaElement;
  const parseButton = screen.getByRole('button', { name: /Переглянути план/i });

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  await user.clear(weekStartInput);
  await user.type(weekStartInput, weekStart.toISOString().split('T')[0]);
  await user.clear(weekEndInput);
  await user.type(weekEndInput, weekEnd.toISOString().split('T')[0]);
  await user.type(textInput, 'Invalid text without day markers');

  await user.click(parseButton);

  await waitFor(() => {
    expect(screen.getByText(/Не вдалося розпізнати план/i)).toBeInTheDocument();
  });
});

it('saves plan without AI', async () => {
  render();

  const weekStartInput = screen.getByLabelText(/Початок тижня/i) as HTMLInputElement;
  const weekEndInput = screen.getByLabelText(/Кінець тижня/i) as HTMLInputElement;
  const textInput = screen.getByRole('textbox', { name: /Текст плану/i }) as HTMLTextAreaElement;
  const parseButton = screen.getByRole('button', { name: /Переглянути план/i });

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  act(() => {
    fireEvent.change(weekStartInput, { target: { value: weekStart.toISOString().split('T')[0] } });
    fireEvent.change(weekEndInput, { target: { value: weekEnd.toISOString().split('T')[0] } });
  });
  await user.type(
    textInput,
    `День 1
1. Присідання зі штангою
3 підходи по 8-12`
  );

  await waitFor(() => {
    expect(parseButton).not.toBeDisabled();
  });

  await user.click(parseButton);

  await waitFor(() => {
    expect(screen.getByText(/Розпізнаний план/i)).toBeInTheDocument();
  });

  const saveButton = screen.getByRole('button', { name: /Зберегти без AI підказок/i });
  await user.click(saveButton);

  await waitFor(() => {
    expect(mockSavePlan).toHaveBeenCalled();
  });
});

it('shows error when saving plan fails', async () => {
  mockSavePlan.mockImplementation((_, options) => {
    options?.onError?.();
  });

  render();

  const weekStartInput = screen.getByLabelText(/Початок тижня/i) as HTMLInputElement;
  const weekEndInput = screen.getByLabelText(/Кінець тижня/i) as HTMLInputElement;
  const textInput = screen.getByRole('textbox', { name: /Текст плану/i }) as HTMLTextAreaElement;
  const parseButton = screen.getByRole('button', { name: /Переглянути план/i });

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  act(() => {
    fireEvent.change(weekStartInput, { target: { value: weekStart.toISOString().split('T')[0] } });
    fireEvent.change(weekEndInput, { target: { value: weekEnd.toISOString().split('T')[0] } });
  });
  await user.type(
    textInput,
    `День 1
1. Присідання зі штангою
3 підходи по 8-12`
  );

  await waitFor(() => {
    expect(parseButton).not.toBeDisabled();
  });

  await user.click(parseButton);

  await waitFor(() => {
    expect(screen.getByText(/Розпізнаний план/i)).toBeInTheDocument();
  });

  const saveButton = screen.getByRole('button', { name: /Зберегти без AI підказок/i });
  await user.click(saveButton);

  await waitFor(() => {
    expect(screen.getByText(/Помилка при збереженні плану/i)).toBeInTheDocument();
  });
});

it('shows error when OpenAI API key is not configured', async () => {
  const mockSavedPlan = { id: 'saved-plan-123', userId: 'user-123' };
  mockSavePlan.mockImplementation((_, options) => {
    options?.onSuccess?.(mockSavedPlan);
  });

  const apiKeyError = new Error('OpenAI API key is not configured');
  mockGenerateSuggestions.mockImplementation((_, options) => {
    options?.onError?.(apiKeyError);
  });

  render();

  const weekStartInput = screen.getByLabelText(/Початок тижня/i) as HTMLInputElement;
  const weekEndInput = screen.getByLabelText(/Кінець тижня/i) as HTMLInputElement;
  const textInput = screen.getByRole('textbox', { name: /Текст плану/i }) as HTMLTextAreaElement;
  const parseButton = screen.getByRole('button', { name: /Переглянути план/i });

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  act(() => {
    fireEvent.change(weekStartInput, { target: { value: weekStart.toISOString().split('T')[0] } });
    fireEvent.change(weekEndInput, { target: { value: weekEnd.toISOString().split('T')[0] } });
  });
  await user.type(
    textInput,
    `День 1
1. Присідання зі штангою
3 підходи по 8-12`
  );

  await waitFor(() => {
    expect(parseButton).not.toBeDisabled();
  });

  await user.click(parseButton);

  await waitFor(() => {
    expect(screen.getByText(/Розпізнаний план/i)).toBeInTheDocument();
  });

  const saveButton = screen.getByRole('button', { name: /Зберегти та отримати AI підказки/i });
  await user.click(saveButton);

  await waitFor(() => {
    expect(screen.getByText(/OpenAI API ключ не налаштовано/i)).toBeInTheDocument();
  });
});

it('shows error when OpenAI rate limit is exceeded', async () => {
  const mockSavedPlan = { id: 'saved-plan-123', userId: 'user-123' };
  mockSavePlan.mockImplementation((_, options) => {
    options?.onSuccess?.(mockSavedPlan);
  });

  const rateLimitError = { status: 429, message: 'Rate limit exceeded' };
  mockGenerateSuggestions.mockImplementation((_, options) => {
    options?.onError?.(rateLimitError);
  });

  render();

  const weekStartInput = screen.getByLabelText(/Початок тижня/i) as HTMLInputElement;
  const weekEndInput = screen.getByLabelText(/Кінець тижня/i) as HTMLInputElement;
  const textInput = screen.getByRole('textbox', { name: /Текст плану/i }) as HTMLTextAreaElement;
  const parseButton = screen.getByRole('button', { name: /Переглянути план/i });

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  act(() => {
    fireEvent.change(weekStartInput, { target: { value: weekStart.toISOString().split('T')[0] } });
    fireEvent.change(weekEndInput, { target: { value: weekEnd.toISOString().split('T')[0] } });
  });
  await user.type(
    textInput,
    `День 1
1. Присідання зі штангою
3 підходи по 8-12`
  );

  await waitFor(() => {
    expect(parseButton).not.toBeDisabled();
  });

  await user.click(parseButton);

  await waitFor(() => {
    expect(screen.getByText(/Розпізнаний план/i)).toBeInTheDocument();
  });

  const saveButton = screen.getByRole('button', { name: /Зберегти та отримати AI підказки/i });
  await user.click(saveButton);

  await waitFor(() => {
    expect(screen.getByText(/OpenAI Rate Limit/i)).toBeInTheDocument();
  });
});

it('shows error when saving AI suggestions fails', async () => {
  const mockSavedPlan = { id: 'saved-plan-123', userId: 'user-123' };
  mockSavePlan.mockImplementation((_, options) => {
    options?.onSuccess?.(mockSavedPlan);
  });

  const suggestionsMap = new Map([
    [
      'Присідання зі штангою',
      {
        id: 'suggestion-1',
        userId: 'user-123',
        weekPlanId: 'plan-123',
        exerciseName: 'Присідання зі штангою',
        suggestedWeights: [100, 105, 110],
        suggestedReps: [15, 12, 10],
        reasoning: 'Test',
        createdAt: new Date(),
      },
    ],
  ]);

  mockGenerateSuggestions.mockImplementation((_, options) => {
    options?.onSuccess?.(suggestionsMap);
  });

  mockSaveSuggestions.mockImplementation((_, options) => {
    options?.onError?.();
  });

  render();

  const weekStartInput = screen.getByLabelText(/Початок тижня/i) as HTMLInputElement;
  const weekEndInput = screen.getByLabelText(/Кінець тижня/i) as HTMLInputElement;
  const textInput = screen.getByRole('textbox', { name: /Текст плану/i }) as HTMLTextAreaElement;
  const parseButton = screen.getByRole('button', { name: /Переглянути план/i });

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  act(() => {
    fireEvent.change(weekStartInput, { target: { value: weekStart.toISOString().split('T')[0] } });
    fireEvent.change(weekEndInput, { target: { value: weekEnd.toISOString().split('T')[0] } });
  });
  await user.type(
    textInput,
    `День 1
1. Присідання зі штангою
3 підходи по 8-12`
  );

  await waitFor(() => {
    expect(parseButton).not.toBeDisabled();
  });

  await user.click(parseButton);

  await waitFor(() => {
    expect(screen.getByText(/Розпізнаний план/i)).toBeInTheDocument();
  });

  const saveButton = screen.getByRole('button', { name: /Зберегти та отримати AI підказки/i });
  await user.click(saveButton);

  await waitFor(() => {
    expect(screen.getByText(/Помилка при збереженні плану/i)).toBeInTheDocument();
  });
});
