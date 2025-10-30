import { Save, ChevronLeft, Edit, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAISuggestions } from '../../api/useAISuggestions';
import { useSaveWorkout } from '../../api/useSaveWorkout';
import { useUpdateWorkout } from '../../api/useUpdateWorkout';
import { useWorkoutData } from '../../api/useWorkoutData';
import { Exercise } from '../Exercise';
import type { CompletedExercise } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Alert, AlertDescription, Loader } from '@/shared/ui';

export const WorkoutPage = () => {
  const { planId, day } = useParams<{ planId: string; day: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: workoutData, isLoading: loading, error: workoutError } = useWorkoutData(planId, day, user?.uid);

  const { data: suggestions = new Map() } = useAISuggestions(user?.uid, planId);

  const saveWorkout = useSaveWorkout();
  const updateWorkout = useUpdateWorkout();

  useEffect(() => {
    if (workoutData) {
      const { dayWorkout, existingWorkout } = workoutData;

      let initialExercises: CompletedExercise[];

      if (existingWorkout) {
        setIsEditing(false);
        initialExercises = existingWorkout.exercises;
      } else {
        setIsEditing(false);
        initialExercises = dayWorkout.exercises.map((ex) => ({
          exerciseId: ex.id,
          name: ex.name,
          sets: Array.from({ length: ex.sets }, (_, i) => ({
            setNumber: i + 1,
            weight: 0,
            reps: parseInt(ex.reps.split('-')[0]) || 0,
          })),
        }));
      }

      setCompletedExercises(initialExercises);

      if (!existingWorkout) {
        const exercisesWithSuggestions = initialExercises.map((ex) => {
          const suggestion = suggestions.get(ex.name);
          if (suggestion) {
            return {
              ...ex,
              sets: ex.sets.map((set, index) => ({
                ...set,
                weight: suggestion.suggestedWeights[index] || 0,
                reps: suggestion.suggestedReps[index] || set.reps,
              })),
            };
          }
          return ex;
        });
        setCompletedExercises(exercisesWithSuggestions);
      }
    }
  }, [workoutData, suggestions]);

  useEffect(() => {
    if (workoutError) {
      navigate('/');
    }
  }, [workoutError, navigate]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!workoutData || !user) return;

    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const { plan, dayWorkout, existingWorkout } = workoutData;

    const onCommonSuccess = () => {
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    };

    const onCommonError = () => {
      setSaveError('Помилка при збереженні тренування');
    };

    const onCommonSettled = () => {
      setSaving(false);
    };

    if (existingWorkout) {
      updateWorkout.mutate(
        {
          ...existingWorkout,
          date: new Date(),
          exercises: completedExercises,
        },
        {
          onSuccess: onCommonSuccess,
          onError: onCommonError,
          onSettled: onCommonSettled,
        }
      );
    } else {
      saveWorkout.mutate(
        {
          userId: user.uid,
          date: new Date(),
          dayNumber: dayWorkout.day,
          weekPlanId: plan.id,
          exercises: completedExercises,
        },
        {
          onSuccess: onCommonSuccess,
          onError: onCommonError,
          onSettled: onCommonSettled,
        }
      );
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">День {day}</h1>
          {workoutData?.plan && (
            <p className="text-muted-foreground mt-1">
              {workoutData.plan.weekStartDate.toLocaleDateString('uk-UA')} -{' '}
              {workoutData.plan.weekEndDate.toLocaleDateString('uk-UA')}
              {workoutData.existingWorkout && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  Виконано {workoutData.existingWorkout.date.toLocaleDateString('uk-UA')}
                </span>
              )}
            </p>
          )}
        </div>

        {isEditing ? (
          <div className="flex gap-2">
            {workoutData?.existingWorkout && (
              <Button onClick={() => setIsEditing(false)} variant="outline" size="lg">
                <X className="mr-2 h-5 w-5" />
                Скасувати
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving || saveSuccess || saveWorkout.isPending || updateWorkout.isPending}
              size="lg"
            >
              <Save className="mr-2 h-5 w-5" />
              {saveSuccess ? 'Збережено! ✓' : 'Зберегти'}
            </Button>
          </div>
        ) : (
          <Button onClick={handleEditClick} size="lg">
            <Edit className="mr-2 h-5 w-5" />
            Редагувати
          </Button>
        )}
      </div>

      {saveSuccess && (
        <Alert variant="success">
          <AlertDescription>Тренування успішно збережено! Перенаправлення... 💪</AlertDescription>
        </Alert>
      )}

      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {completedExercises.map((exercise, exerciseIdx) => (
          <Exercise
            key={exercise.exerciseId}
            dayWorkout={workoutData?.dayWorkout || null}
            exercise={exercise}
            exerciseNumber={exerciseIdx + 1}
            isEditing={isEditing}
            suggestions={suggestions}
            setCompletedExercises={setCompletedExercises}
          />
        ))}
      </div>
    </div>
  );
};
