import { screen, render as rtlRender } from '@testing-library/react';
import user from '@testing-library/user-event';
import { it, expect, vi } from 'vitest';
import { Exercise } from './index';
import type { ExerciseProps } from './index';
import { createCompletedExercise, createDayWorkout, createAISuggestion } from '@/test/mock';

const mockExercise = createCompletedExercise();

const render = (args: Partial<ExerciseProps> = {}) => {
  rtlRender(
    <Exercise
      dayWorkout={args?.dayWorkout ?? createDayWorkout(1)}
      exercise={args?.exercise ?? createCompletedExercise()}
      exerciseNumber={1}
      isEditing={args?.isEditing ?? false}
      suggestions={args?.suggestions ?? new Map()}
      setCompletedExercises={args?.setCompletedExercises ?? vi.fn()}
      onToggleEdit={args?.onToggleEdit ?? vi.fn()}
      onSave={args?.onSave ?? vi.fn()}
      saving={args?.saving ?? false}
      saveSuccess={args?.saveSuccess ?? false}
    />
  );
};

it('renders exercise name and sets', () => {
  render();
  expect(screen.getByText(/1\. Присідання зі штангою/i)).toBeInTheDocument();
  expect(screen.getAllByText(/100/i).length).toBeGreaterThan(0);
});

it('shows edit button in view mode and save/cancel in edit mode', () => {
  render();
  expect(screen.getByRole('button', { name: /Редагувати/i })).toBeInTheDocument();

  render({ isEditing: true });
  expect(screen.getByRole('button', { name: /Зберегти/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Скасувати/i })).toBeInTheDocument();
});

it('calls callbacks when buttons are clicked', async () => {
  const onToggleEdit = vi.fn();
  const onSave = vi.fn();

  render({ onToggleEdit, isEditing: true, onSave });

  await user.click(screen.getByRole('button', { name: /Зберегти/i }));
  await user.click(screen.getByRole('button', { name: /Скасувати/i }));

  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onToggleEdit).toHaveBeenCalledTimes(1);
});

it('displays AI suggestion when available', () => {
  const suggestion = createAISuggestion({ reasoning: 'Test reasoning' });
  const suggestions = new Map([[mockExercise.name, suggestion]]);

  render({ suggestions });
  expect(screen.getByText(/Test reasoning/i)).toBeInTheDocument();
});

it('disables save button when saving', () => {
  render({ isEditing: true, saving: true });
  expect(screen.getByRole('button', { name: /Зберегти/i })).toBeDisabled();
});
