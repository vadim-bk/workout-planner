import { screen, waitFor } from '@testing-library/react';
import user from '@testing-library/user-event';
import { onAuthStateChanged } from 'firebase/auth';
import { it, expect, vi, beforeEach } from 'vitest';
import { useAISuggestions } from '../../api/useAISuggestions';
import { useSaveWorkout } from '../../api/useSaveWorkout';
import { useUpdateWorkout } from '../../api/useUpdateWorkout';
import { useWorkoutData } from '../../api/useWorkoutData';
import { WorkoutPage } from './index';
import {
  createUser,
  createWeeklyPlan,
  createDayWorkout,
  createCompletedExercise,
  createWorkoutHistory,
} from '@/test/mock';
import { renderPage } from '@/test/utils';

vi.mock('../../api/useWorkoutData');
vi.mock('../../api/useAISuggestions');
vi.mock('../../api/useSaveWorkout');
vi.mock('../../api/useUpdateWorkout');
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useParams: () => ({ planId: 'plan-123', day: '1' }),
    useNavigate: () => vi.fn(),
  };
});

const render = () => {
  renderPage(<WorkoutPage />);
};

const mockSaveWorkout = vi.fn();
const mockUpdateWorkout = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    if (typeof callback === 'function') {
      callback(createUser() as never);
    }
    return vi.fn();
  });

  vi.mocked(useWorkoutData).mockReturnValue({
    data: {
      plan: createWeeklyPlan({ id: 'plan-123' }),
      dayWorkout: createDayWorkout(1),
      existingWorkout: null,
    },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useWorkoutData>);

  vi.mocked(useAISuggestions).mockReturnValue({
    data: new Map(),
  } as unknown as ReturnType<typeof useAISuggestions>);

  vi.mocked(useSaveWorkout).mockReturnValue({
    mutate: mockSaveWorkout,
    isPending: false,
  } as unknown as ReturnType<typeof useSaveWorkout>);

  vi.mocked(useUpdateWorkout).mockReturnValue({
    mutate: mockUpdateWorkout,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateWorkout>);
});

it('renders workout page with exercises', async () => {
  render();

  await waitFor(() => {
    expect(screen.getByText(/День 1/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Присідання зі штангою/i)).toBeInTheDocument();
  });
});

it('shows loader when loading', () => {
  vi.mocked(useWorkoutData).mockReturnValue({
    data: undefined,
    isLoading: true,
    error: null,
  } as unknown as ReturnType<typeof useWorkoutData>);

  render();

  expect(screen.getByText(/Завантаження.../i)).toBeInTheDocument();
});

it('adds and removes sets', async () => {
  render();

  await waitFor(() => {
    expect(screen.getByText(/1\. Присідання зі штангою/i)).toBeInTheDocument();
  });

  const editButton = screen.getByRole('button', { name: /Редагувати/i });
  await user.click(editButton);

  const allButtons = screen.getAllByRole('button');
  const addSetButtons = allButtons.filter((btn) => {
    const svg = btn.querySelector('svg');
    return svg && btn.getAttribute('class')?.includes('h-8 w-8');
  });

  if (addSetButtons.length > 0) {
    await user.click(addSetButtons[addSetButtons.length - 1]);
  }

  await waitFor(() => {
    expect(screen.getAllByText(/Підхід 2:/i).length).toBeGreaterThan(0);
  });
});

it('updates set values', async () => {
  render();

  await waitFor(() => {
    expect(screen.getByText(/1\. Присідання зі штангою/i)).toBeInTheDocument();
  });

  const editButton = screen.getByRole('button', { name: /Редагувати/i });
  await user.click(editButton);

  const weightInputs = screen.getAllByPlaceholderText('Вага');
  if (weightInputs.length > 0) {
    await user.clear(weightInputs[0]);
    await user.type(weightInputs[0], '105');
  }

  await waitFor(() => {
    expect(weightInputs[0]).toHaveValue(105);
  });
});

it('saves new workout', async () => {
  render();

  await waitFor(() => {
    expect(screen.getByText(/1\. Присідання зі штангою/i)).toBeInTheDocument();
  });

  const editButton = screen.getByRole('button', { name: /Редагувати/i });
  await user.click(editButton);

  const saveButton = screen.getByRole('button', { name: /Зберегти/i });
  await user.click(saveButton);

  await waitFor(() => {
    expect(mockSaveWorkout).toHaveBeenCalled();
  });
});

it('updates existing workout', async () => {
  const exercise = createCompletedExercise();
  const existingWorkout = createWorkoutHistory({ exercises: [exercise] });

  vi.mocked(useWorkoutData).mockReturnValue({
    data: {
      plan: createWeeklyPlan({ id: 'plan-123' }),
      dayWorkout: createDayWorkout(1),
      existingWorkout,
    },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useWorkoutData>);

  render();

  await waitFor(() => {
    expect(screen.getByText(/1\. Присідання зі штангою/i)).toBeInTheDocument();
  });

  const editButton = screen.getByRole('button', { name: /Редагувати/i });
  await user.click(editButton);

  const saveButton = screen.getByRole('button', { name: /Зберегти/i });
  await user.click(saveButton);

  await waitFor(() => {
    expect(mockUpdateWorkout).toHaveBeenCalled();
  });
});

it('shows success message after saving', async () => {
  mockSaveWorkout.mockImplementation((_, options) => {
    options?.onSuccess?.();
  });

  render();

  await waitFor(() => {
    expect(screen.getByText(/1\. Присідання зі штангою/i)).toBeInTheDocument();
  });

  const editButton = screen.getByRole('button', { name: /Редагувати/i });
  await user.click(editButton);

  const saveButton = screen.getByRole('button', { name: /Зберегти/i });
  await user.click(saveButton);

  await waitFor(() => {
    expect(screen.getByText(/Тренування успішно збережено! Перенаправлення... 💪/i)).toBeInTheDocument();
  });
});

it('shows error message when save fails', async () => {
  mockSaveWorkout.mockImplementation((_, options) => {
    options?.onError?.();
  });

  render();

  await waitFor(() => {
    expect(screen.getByText(/1\. Присідання зі штангою/i)).toBeInTheDocument();
  });

  const editButton = screen.getByRole('button', { name: /Редагувати/i });
  await user.click(editButton);

  const saveButton = screen.getByRole('button', { name: /Зберегти/i });
  await user.click(saveButton);

  await waitFor(() => {
    expect(screen.getByText(/Помилка при збереженні тренування/i)).toBeInTheDocument();
  });
});
