import { Minus, Plus } from 'lucide-react';
import type { ExerciseSet as ExerciseSetType } from '@/types';
import type { ChangeEvent } from 'react';
import { Button, Input } from '@/shared/ui';

type Props = {
  isViewMode: boolean;
  set: ExerciseSetType;
  showRemoveButton: boolean;
  addSet: () => void;
  removeSet: () => void;
  updateSet: (setNumber: number, field: 'weight' | 'reps', value: number) => void;
};

export const ExerciseSet = ({ isViewMode, set, showRemoveButton, addSet, removeSet, updateSet }: Props) => {
  const { setNumber, weight, reps } = set;

  const handleWeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateSet(setNumber, 'weight', parseFloat(e.target.value) || 0);
  };

  const handleRepsChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateSet(setNumber, 'reps', parseInt(e.target.value) || 0);
  };

  if (isViewMode) {
    return (
      <div key={setNumber} className="flex items-center gap-2 text-sm py-2 px-3 bg-muted/50 rounded-md">
        <span className="font-medium text-muted-foreground min-w-[80px]">Підхід {setNumber}:</span>

        <span className="flex-1">
          {weight > 0 && reps > 0 ? (
            <>
              <span className="font-bold text-lg">{weight} кг</span>
              <span className="mx-2 text-muted-foreground">×</span>
              <span className="font-medium">{reps}</span>
            </>
          ) : (
            <span className="text-muted-foreground italic">План: {reps} повторень</span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 items-center">
      <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Підхід {setNumber}:</span>

      <div>
        <Input
          type="number"
          value={weight || ''}
          onChange={handleWeightChange}
          placeholder="Вага (кг)"
          min="0"
          step="0.5"
          className="text-center"
        />
      </div>

      <div>
        <Input
          type="number"
          value={reps || ''}
          onChange={handleRepsChange}
          placeholder="Повторення"
          min="0"
          className="text-center"
        />
      </div>

      <div className="flex gap-1">
        {showRemoveButton && (
          <Button variant="outline" size="sm" onClick={removeSet} className="h-8 w-8 p-0">
            <Minus className="h-4 w-4" />
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={addSet} className="h-8 w-8 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
