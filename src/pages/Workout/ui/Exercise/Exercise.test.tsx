import { render, screen } from '@testing-library/react';
import user from '@testing-library/user-event';
import { it, expect, vi } from 'vitest';
import { Exercise } from './index';
import { createCompletedExercise, createDayWorkout, createAISuggestion } from '@/test/mock';

const mockExercise = createCompletedExercise();
const mockOnToggleEdit = vi.fn();

const defaultProps = {
  dayWorkout: createDayWorkout(1),
  exercise: mockExercise,
  exerciseNumber: 1,
  isEditing: false,
  suggestions: new Map(),
  setCompletedExercises: vi.fn(),
  onToggleEdit: mockOnToggleEdit,
  onSave: vi.fn(),
  saving: false,
  saveSuccess: false,
};

it('renders exercise name and details', () => {
  render(<Exercise {...defaultProps} />);

  expect(screen.getByText(/1\. Присідання зі штангою/i)).toBeInTheDocument();
});

it('shows edit button when not editing', () => {
  render(<Exercise {...defaultProps} />);

  expect(screen.getByRole('button', { name: /Редагувати/i })).toBeInTheDocument();
});

it('shows save and cancel buttons when editing', () => {
  render(<Exercise {...defaultProps} isEditing={true} />);

  expect(screen.getByRole('button', { name: /Зберегти/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Скасувати/i })).toBeInTheDocument();
});

it('calls onToggleEdit when edit button is clicked', async () => {
  render(<Exercise {...defaultProps} />);

  const editButton = screen.getByRole('button', { name: /Редагувати/i });
  await user.click(editButton);

  expect(mockOnToggleEdit).toHaveBeenCalledTimes(1);
});

it('displays AI suggestion reasoning when available', () => {
  const suggestion = createAISuggestion({ reasoning: 'Test reasoning' });
  const suggestions = new Map([[mockExercise.name, suggestion]]);

  render(<Exercise {...defaultProps} suggestions={suggestions} />);

  expect(screen.getByText(/Test reasoning/i)).toBeInTheDocument();
});

it('renders exercise sets', () => {
  render(<Exercise {...defaultProps} />);

  const sets = screen.getAllByText(/100/i);
  expect(sets.length).toBeGreaterThan(0);
  expect(screen.getAllByText(/12/i).length).toBeGreaterThan(0);
});
