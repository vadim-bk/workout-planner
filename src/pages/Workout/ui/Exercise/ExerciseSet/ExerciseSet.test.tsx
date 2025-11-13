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

it('calls updateSet when input changes', async () => {
  render(<ExerciseSet {...defaultProps} isViewMode={false} />);

  const weightInput = screen.getByPlaceholderText(/Вага/i);
  await user.clear(weightInput);
  await user.type(weightInput, '105');

  expect(mockUpdateSet).toHaveBeenCalledWith(1, 'weight', expect.any(Number));
});

it('calls removeSet and addSet when buttons are clicked', async () => {
  render(<ExerciseSet {...defaultProps} isViewMode={false} />);

  const buttons = screen.getAllByRole('button');
  await user.click(buttons[0]);
  await user.click(buttons[buttons.length - 1]);

  expect(mockRemoveSet).toHaveBeenCalledTimes(1);
  expect(mockAddSet).toHaveBeenCalledTimes(1);
});
