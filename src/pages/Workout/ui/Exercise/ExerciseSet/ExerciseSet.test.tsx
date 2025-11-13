import { render, screen } from '@testing-library/react';
import user from '@testing-library/user-event';
import { it, expect, vi } from 'vitest';
import { ExerciseSet } from './index';
import type { ExerciseSet as ExerciseSetType } from '@/types';

const mockSet: ExerciseSetType = {
  setNumber: 1,
  weight: 100,
  reps: 12,
};

const mockUpdateSet = vi.fn();
const mockRemoveSet = vi.fn();
const mockAddSet = vi.fn();

const defaultProps = {
  set: mockSet,
  isViewMode: false,
  showRemoveButton: true,
  updateSet: mockUpdateSet,
  removeSet: mockRemoveSet,
  addSet: mockAddSet,
};

it('renders set in view mode', () => {
  render(<ExerciseSet {...defaultProps} isViewMode={true} />);

  expect(screen.getByText(/100/i)).toBeInTheDocument();
  expect(screen.getByText(/12/i)).toBeInTheDocument();
});

it('renders input fields in edit mode', () => {
  render(<ExerciseSet {...defaultProps} isViewMode={false} />);

  expect(screen.getByPlaceholderText(/Вага/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Повторення/i)).toBeInTheDocument();
});

it('updates weight when input changes', async () => {
  render(<ExerciseSet {...defaultProps} isViewMode={false} />);

  const weightInput = screen.getByPlaceholderText(/Вага/i);
  await user.clear(weightInput);
  await user.type(weightInput, '105');

  expect(mockUpdateSet).toHaveBeenCalled();
});

it('updates reps when input changes', async () => {
  render(<ExerciseSet {...defaultProps} isViewMode={false} />);

  const repsInput = screen.getByPlaceholderText(/Повторення/i);
  await user.clear(repsInput);
  await user.type(repsInput, '15');

  expect(mockUpdateSet).toHaveBeenCalled();
});

it('calls removeSet when remove button is clicked', async () => {
  render(<ExerciseSet {...defaultProps} isViewMode={false} />);

  const buttons = screen.getAllByRole('button');
  const removeButton = buttons[0];
  await user.click(removeButton);

  expect(mockRemoveSet).toHaveBeenCalledTimes(1);
});

it('does not show remove button when showRemoveButton is false', () => {
  render(<ExerciseSet {...defaultProps} showRemoveButton={false} />);

  const buttons = screen.getAllByRole('button');
  expect(buttons).toHaveLength(1);
});
