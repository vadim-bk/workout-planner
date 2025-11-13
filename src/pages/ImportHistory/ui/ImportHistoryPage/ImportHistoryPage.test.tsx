import { screen, waitFor } from '@testing-library/react';
import user from '@testing-library/user-event';
import { onAuthStateChanged } from 'firebase/auth';
import { it, expect, vi, beforeEach } from 'vitest';
import { useSaveWorkoutHistory } from '../../api/useSaveWorkoutHistory';
import { ImportHistoryPage } from './index';
import { createUser } from '@/test/mock';
import { renderPage } from '@/test/utils';

vi.mock('../../api/useSaveWorkoutHistory');
vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  return {
    ...actual,
    onAuthStateChanged: vi.fn(),
  };
});

const render = () => {
  renderPage(<ImportHistoryPage />);
};

const mockSaveHistory = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    if (typeof callback === 'function') {
      callback(createUser() as never);
    }
    return vi.fn();
  });

  vi.mocked(useSaveWorkoutHistory).mockReturnValue({
    mutateAsync: mockSaveHistory,
    isPending: false,
  } as unknown as ReturnType<typeof useSaveWorkoutHistory>);
});

it('renders import form', () => {
  render();

  expect(screen.getByText(/Імпорт історії тренувань/i)).toBeInTheDocument();
  expect(screen.getByRole('textbox')).toBeInTheDocument();
});

it('parses and imports workout history', async () => {
  mockSaveHistory.mockResolvedValue({ id: 'test-id' });

  render();

  const textInput = screen.getByRole('textbox') as HTMLTextAreaElement;
  const importButton = screen.getByRole('button', { name: /Імпортувати/i });

  const historyText = `Тиждень: 25.08.2024 - 31.08.2024

День 1
1. Присідання зі штангою – 3×8-12
100 кг × 12
100 кг × 10
100 кг × 8`;

  await user.type(textInput, historyText);

  await waitFor(() => {
    expect(importButton).not.toBeDisabled();
  });

  await user.click(importButton);

  await waitFor(() => {
    expect(mockSaveHistory).toHaveBeenCalled();
  });
});

it('shows error for invalid format', async () => {
  render();

  const textInput = screen.getByRole('textbox') as HTMLTextAreaElement;
  const importButton = screen.getByRole('button', { name: /Імпортувати/i });

  await user.type(textInput, 'Invalid text without week format');

  await waitFor(() => {
    expect(importButton).not.toBeDisabled();
  });

  await user.click(importButton);

  await waitFor(() => {
    expect(screen.getByText(/Не вдалося знайти тренування в тексті/i)).toBeInTheDocument();
  });
});

it('loads example when button is clicked', async () => {
  render();

  const showExampleButton = screen.getByRole('button', { name: /Показати приклад/i });
  await user.click(showExampleButton);

  await waitFor(() => {
    expect(screen.getByText(/Приклад формату даних/i)).toBeInTheDocument();
  });

  const loadExampleButton = screen.getByRole('button', { name: /Завантажити приклад у поле/i });
  await user.click(loadExampleButton);

  await waitFor(() => {
    const textInput = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textInput.value).toContain('Тиждень:');
  });
});

it('shows success message after successful import', async () => {
  mockSaveHistory.mockResolvedValue({ id: 'test-id' });

  render();

  const textInput = screen.getByRole('textbox') as HTMLTextAreaElement;
  const importButton = screen.getByRole('button', { name: /Імпортувати/i });

  const historyText = `Тиждень: 25.08.2024 - 31.08.2024

День 1
1. Присідання зі штангою – 3×8-12
100 кг × 12`;

  await user.type(textInput, historyText);

  await waitFor(() => {
    expect(importButton).not.toBeDisabled();
  });

  await user.click(importButton);

  await waitFor(() => {
    expect(screen.getByText(/Успішно імпортовано/i)).toBeInTheDocument();
  });
});

it('shows error when parsing fails with empty result', async () => {
  render();

  const textInput = screen.getByRole('textbox') as HTMLTextAreaElement;
  const importButton = screen.getByRole('button', { name: /Імпортувати/i });

  await user.type(textInput, 'Some invalid text');
  await waitFor(() => expect(importButton).not.toBeDisabled());

  await user.click(importButton);
  await waitFor(() => expect(screen.getByText(/Не вдалося знайти тренування в тексті/i)).toBeInTheDocument());
});

it('shows partial success message when some imports fail', async () => {
  mockSaveHistory.mockImplementation(() => Promise.reject(new Error('Failed')));
  mockSaveHistory.mockResolvedValueOnce({ id: 'test-id' });
  mockSaveHistory.mockRejectedValueOnce(new Error('Failed'));

  render();

  const textInput = screen.getByRole('textbox') as HTMLTextAreaElement;
  const importButton = screen.getByRole('button', { name: /Імпортувати/i });

  const historyText = `Тиждень: 25.08.2024 - 31.08.2024

День 1
1. Присідання зі штангою – 3×8-12
100 кг × 12

День 2
1. Жим ногами – 3×10-15
150 кг × 15`;

  await user.type(textInput, historyText);
  await waitFor(() => expect(importButton).not.toBeDisabled());

  await user.click(importButton);
  await waitFor(() => expect(screen.getByText(/Частково імпортовано/i)).toBeInTheDocument());
});

it('shows error when all imports fail', async () => {
  mockSaveHistory.mockRejectedValue(new Error('Failed'));

  render();

  const textInput = screen.getByRole('textbox') as HTMLTextAreaElement;
  const importButton = screen.getByRole('button', { name: /Імпортувати/i });

  const historyText = `Тиждень: 25.08.2024 - 31.08.2024

День 1
1. Присідання зі штангою – 3×8-12
100 кг × 12`;

  await user.type(textInput, historyText);
  await waitFor(() => expect(importButton).not.toBeDisabled());

  await user.click(importButton);
  await waitFor(() => expect(screen.getByText(/Помилка при імпорті тренувань/i)).toBeInTheDocument());
});

it('clears textarea after successful import', async () => {
  mockSaveHistory.mockResolvedValue({ id: 'test-id' });

  render();

  const textInput = screen.getByRole('textbox') as HTMLTextAreaElement;
  const importButton = screen.getByRole('button', { name: /Імпортувати/i });

  const historyText = `Тиждень: 25.08.2024 - 31.08.2024

День 1
1. Присідання зі штангою – 3×8-12
100 кг × 12`;

  await user.type(textInput, historyText);
  await waitFor(() => expect(importButton).not.toBeDisabled());

  await user.click(importButton);
  await waitFor(() => expect(textInput.value).toBe(''));
});
