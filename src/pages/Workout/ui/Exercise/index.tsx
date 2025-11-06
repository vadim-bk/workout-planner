import { Edit, X, Save } from 'lucide-react';
import { ExerciseSet } from './ExerciseSet';
import type { CompletedExercise, DayWorkout, AISuggestion } from '@/types';
import type { Dispatch, SetStateAction } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/shared/ui';

type Props = {
  dayWorkout: DayWorkout | null;
  exercise: CompletedExercise;
  exerciseNumber: number;
  isEditing: boolean;
  suggestions: Map<string, AISuggestion>;
  setCompletedExercises: Dispatch<SetStateAction<CompletedExercise[]>>;
  onToggleEdit: () => void;
  onSave: () => void;
  saving: boolean;
  saveSuccess: boolean;
};

export const Exercise = ({
  dayWorkout,
  exercise,
  exerciseNumber,
  isEditing,
  suggestions,
  setCompletedExercises,
  onToggleEdit,
  onSave,
  saving,
  saveSuccess,
}: Props) => {
  const { exerciseId } = exercise;

  const suggestion = suggestions.get(exercise.name);
  const originalExercise = dayWorkout?.exercises.find((exerciseItem) => exerciseItem.id === exerciseId);

  const addSet = () => {
    setCompletedExercises((prev) =>
      prev.map((exerciseItem) =>
        exerciseItem.exerciseId === exerciseId
          ? {
              ...exerciseItem,
              sets: [...exerciseItem.sets, { setNumber: exerciseItem.sets.length + 1, weight: 0, reps: 0 }],
            }
          : exerciseItem
      )
    );
  };

  const removeSet = (setNumber: number) => () => {
    setCompletedExercises((prev) =>
      prev.map((exerciseItem) =>
        exerciseItem.exerciseId === exerciseId
          ? {
              ...exerciseItem,
              sets: exerciseItem.sets.filter((set) => set.setNumber !== setNumber),
            }
          : exerciseItem
      )
    );
  };

  const updateSet = (setNumber: number, field: 'weight' | 'reps', value: number) => {
    setCompletedExercises((prev) =>
      prev.map((exerciseItem) =>
        exerciseItem.exerciseId === exerciseId
          ? {
              ...exerciseItem,
              sets: exerciseItem.sets.map((set) => (set.setNumber === setNumber ? { ...set, [field]: value } : set)),
            }
          : exerciseItem
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl">
              {exerciseNumber}. {exercise.name}
            </CardTitle>

            <CardDescription className="mt-1 text-xs sm:text-sm">
              {originalExercise?.sets} підходи × {originalExercise?.reps}
            </CardDescription>
          </div>

          {isEditing ? (
            <>
              <Button onClick={onSave} disabled={saving || saveSuccess} size="sm" className="h-8">
                <Save className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">{saveSuccess ? 'Збережено! ✓' : 'Зберегти'}</span>
                <span className="sm:hidden">{saveSuccess ? '✓' : 'Зберегти'}</span>
              </Button>
              <Button onClick={onToggleEdit} variant="outline" size="sm" className="h-8">
                <X className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Скасувати</span>
              </Button>
            </>
          ) : (
            <Button onClick={onToggleEdit} variant="default" size="sm" className="h-8">
              <Edit className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Редагувати</span>
            </Button>
          )}
        </div>

        {suggestion?.reasoning && (
          <p className="text-xs text-muted-foreground mt-2 italic">💡 {suggestion.reasoning}</p>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {exercise.sets.map((set) => (
            <ExerciseSet
              key={set.setNumber}
              isViewMode={!isEditing}
              set={set}
              showRemoveButton={exercise.sets.length > 1}
              addSet={addSet}
              removeSet={removeSet(set.setNumber)}
              updateSet={updateSet}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
