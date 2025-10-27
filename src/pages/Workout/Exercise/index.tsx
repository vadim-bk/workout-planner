import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { CompletedExercise, DayWorkout, AISuggestion } from "@/types";
import { Sparkles } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { ExerciseSet } from "./ExerciseSet";

type Props = {
  dayWorkout: DayWorkout | null;
  exercise: CompletedExercise;
  exerciseNumber: number;
  isEditing: boolean;
  suggestions: Map<string, AISuggestion>;
  setCompletedExercises: Dispatch<SetStateAction<CompletedExercise[]>>;
};

export const Exercise = ({
  dayWorkout,
  exercise,
  exerciseNumber,
  isEditing,
  suggestions,
  setCompletedExercises,
}: Props) => {
  const { exerciseId } = exercise;

  const suggestion = suggestions.get(exercise.name);
  const originalExercise = dayWorkout?.exercises.find(
    (exerciseItem) => exerciseItem.id === exerciseId
  );

  const addSet = () => {
    setCompletedExercises((prev) =>
      prev.map((exerciseItem) =>
        exerciseItem.exerciseId === exerciseId
          ? {
              ...exerciseItem,
              sets: [
                ...exerciseItem.sets,
                { setNumber: exerciseItem.sets.length + 1, weight: 0, reps: 0 },
              ],
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
              sets: exerciseItem.sets.filter(
                (set) => set.setNumber !== setNumber
              ),
            }
          : exerciseItem
      )
    );
  };

  const updateSet = (
    setNumber: number,
    field: "weight" | "reps",
    value: number
  ) => {
    setCompletedExercises((prev) =>
      prev.map((exerciseItem) =>
        exerciseItem.exerciseId === exerciseId
          ? {
              ...exerciseItem,
              sets: exerciseItem.sets.map((set) =>
                set.setNumber === setNumber ? { ...set, [field]: value } : set
              ),
            }
          : exerciseItem
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">
              {exerciseNumber}. {exercise.name}
            </CardTitle>

            <CardDescription className="mt-1">
              {originalExercise?.sets} підходи × {originalExercise?.reps}
            </CardDescription>
          </div>

          {suggestion && (
            <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI підказка
            </div>
          )}
        </div>

        {suggestion?.reasoning && (
          <p className="text-xs text-muted-foreground mt-2 italic">
            💡 {suggestion.reasoning}
          </p>
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
