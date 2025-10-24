import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  WeeklyPlan,
  DayWorkout,
  CompletedExercise,
  AISuggestion,
  WorkoutHistory,
} from "@/types";
import { Save, ChevronLeft, Sparkles, Edit, X } from "lucide-react";

export function WorkoutPage() {
  const { planId, day } = useParams<{ planId: string; day: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [dayWorkout, setDayWorkout] = useState<DayWorkout | null>(null);
  const [completedExercises, setCompletedExercises] = useState<
    CompletedExercise[]
  >([]);
  const [suggestions, setSuggestions] = useState<Map<string, AISuggestion>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [existingWorkout, setExistingWorkout] = useState<WorkoutHistory | null>(
    null
  );

  useEffect(() => {
    loadWorkout();
  }, [planId, day, user]);

  const loadWorkout = async () => {
    if (!planId || !day || !user) return;

    try {
      // Load the plan
      const planDoc = await getDoc(doc(db, "workout_plans", planId));
      if (!planDoc.exists()) {
        navigate("/");
        return;
      }

      const planData = {
        id: planDoc.id,
        ...planDoc.data(),
        weekStartDate: planDoc.data().weekStartDate.toDate(),
        weekEndDate: planDoc.data().weekEndDate.toDate(),
        createdAt: planDoc.data().createdAt.toDate(),
      } as WeeklyPlan;

      setPlan(planData);

      const currentDay = planData.days.find((d) => d.day === parseInt(day));
      if (!currentDay) {
        navigate("/");
        return;
      }

      setDayWorkout(currentDay);

      // Check if there's already a saved workout for this day
      const historyRef = collection(db, "workout_history");
      const historyQuery = query(
        historyRef,
        where("userId", "==", user.uid),
        where("weekPlanId", "==", planId),
        where("dayNumber", "==", parseInt(day))
      );

      const historySnapshot = await getDocs(historyQuery);

      let initialExercises: CompletedExercise[];

      if (!historySnapshot.empty) {
        // Load existing workout data
        const existingWorkoutDoc = historySnapshot.docs[0];
        const existingData = {
          id: existingWorkoutDoc.id,
          ...existingWorkoutDoc.data(),
          date: existingWorkoutDoc.data().date.toDate(),
        } as WorkoutHistory;

        setExistingWorkout(existingData);
        setIsEditing(false); // Start in view mode if data exists
        initialExercises = existingData.exercises;
      } else {
        // Initialize with empty sets if no existing workout
        setIsEditing(true); // Start in edit mode if no data
        initialExercises = currentDay.exercises.map((ex) => ({
          exerciseId: ex.id,
          name: ex.name,
          sets: Array.from({ length: ex.sets }, (_, i) => ({
            setNumber: i + 1,
            weight: 0,
            reps: 0,
          })),
        }));
      }

      setCompletedExercises(initialExercises);

      // Load AI suggestions
      const suggestionsRef = collection(db, "ai_suggestions");
      const suggestionsQuery = query(
        suggestionsRef,
        where("userId", "==", user.uid),
        where("weekPlanId", "==", planId)
      );

      const suggestionsSnapshot = await getDocs(suggestionsQuery);
      const suggestionsMap = new Map<string, AISuggestion>();

      suggestionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        suggestionsMap.set(data.exerciseName, {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as AISuggestion);
      });

      setSuggestions(suggestionsMap);

      // Auto-fill weights from AI suggestions ONLY if no existing workout
      if (historySnapshot.empty) {
        const exercisesWithSuggestions = initialExercises.map((ex) => {
          const suggestion = suggestionsMap.get(ex.name);
          if (suggestion && suggestion.suggestedWeights.length > 0) {
            return {
              ...ex,
              sets: ex.sets.map((set, idx) => ({
                ...set,
                weight:
                  suggestion.suggestedWeights[idx] ||
                  suggestion.suggestedWeights[0] ||
                  0,
              })),
            };
          }
          return ex;
        });

        setCompletedExercises(exercisesWithSuggestions);
      }
    } catch (error) {
      console.error("Error loading workout:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSet = (
    exerciseIdx: number,
    setIdx: number,
    field: "weight" | "reps",
    value: number
  ) => {
    const updated = [...completedExercises];
    updated[exerciseIdx].sets[setIdx][field] = value;
    setCompletedExercises(updated);
  };

  const handleSave = async () => {
    if (!plan || !dayWorkout || !user) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      if (existingWorkout) {
        // Update existing workout
        const workoutRef = doc(db, "workout_history", existingWorkout.id);
        await updateDoc(workoutRef, {
          date: Timestamp.fromDate(new Date()),
          exercises: completedExercises,
        });
      } else {
        // Create new workout
        const historyRef = collection(db, "workout_history");
        const docRef = await addDoc(historyRef, {
          userId: user.uid,
          date: Timestamp.fromDate(new Date()),
          dayNumber: dayWorkout.day,
          weekPlanId: plan.id,
          exercises: completedExercises,
        });

        // Update existingWorkout state with the new document
        setExistingWorkout({
          id: docRef.id,
          userId: user.uid,
          date: new Date(),
          dayNumber: dayWorkout.day,
          weekPlanId: plan.id,
          exercises: completedExercises,
        });
      }

      setSaveSuccess(true);
      setIsEditing(false); // Exit edit mode after save

      // Clear success message after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Помилка при збереженні тренування");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Завантаження...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">День {day}</h1>
            {plan && (
              <p className="text-muted-foreground mt-1">
                {plan.weekStartDate.toLocaleDateString("uk-UA")} -{" "}
                {plan.weekEndDate.toLocaleDateString("uk-UA")}
                {existingWorkout && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Виконано {existingWorkout.date.toLocaleDateString("uk-UA")}
                  </span>
                )}
              </p>
            )}
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              {existingWorkout && (
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  size="lg"
                >
                  <X className="mr-2 h-5 w-5" />
                  Скасувати
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || saveSuccess}
                size="lg"
              >
                <Save className="mr-2 h-5 w-5" />
                {saveSuccess ? "Збережено! ✓" : "Зберегти"}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)} size="lg">
              <Edit className="mr-2 h-5 w-5" />
              Редагувати
            </Button>
          )}
        </div>

        {saveSuccess && (
          <Alert variant="success">
            <AlertDescription>
              Тренування успішно збережено! Перенаправлення... 💪
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {completedExercises.map((exercise, exerciseIdx) => {
            const suggestion = suggestions.get(exercise.name);
            const originalExercise = dayWorkout?.exercises[exerciseIdx];

            return (
              <Card key={exercise.exerciseId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {exerciseIdx + 1}. {exercise.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {originalExercise?.sets} підходи ×{" "}
                        {originalExercise?.reps}
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
                  {isEditing ? (
                    // Edit Mode - показуємо інпути
                    <div className="space-y-3">
                      {exercise.sets.map((set, setIdx) => (
                        <div
                          key={setIdx}
                          className="grid grid-cols-[auto_1fr_1fr] gap-3 items-center"
                        >
                          <span className="text-sm font-medium text-muted-foreground min-w-[80px]">
                            Підхід {set.setNumber}:
                          </span>
                          <div>
                            <Input
                              type="number"
                              value={set.weight || ""}
                              onChange={(e) =>
                                updateSet(
                                  exerciseIdx,
                                  setIdx,
                                  "weight",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="Вага (кг)"
                              min="0"
                              step="0.5"
                              className="text-center"
                            />
                          </div>
                          <div>
                            <Input
                              type="number"
                              value={set.reps || ""}
                              onChange={(e) =>
                                updateSet(
                                  exerciseIdx,
                                  setIdx,
                                  "reps",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              placeholder="Повторення"
                              min="0"
                              className="text-center"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // View Mode - показуємо дані
                    <div className="space-y-2">
                      {exercise.sets.map((set, setIdx) => (
                        <div
                          key={setIdx}
                          className="flex items-center gap-2 text-sm py-2 px-3 bg-muted/50 rounded-md"
                        >
                          <span className="font-medium text-muted-foreground min-w-[80px]">
                            Підхід {set.setNumber}:
                          </span>
                          <span className="flex-1">
                            {set.weight > 0 && (
                              <span className="font-bold text-lg">
                                {set.weight} кг
                              </span>
                            )}
                            {set.weight > 0 && set.reps > 0 && (
                              <span className="mx-2 text-muted-foreground">
                                ×
                              </span>
                            )}
                            {set.reps > 0 && (
                              <span className="font-medium">{set.reps}</span>
                            )}
                            {set.weight === 0 && set.reps === 0 && (
                              <span className="text-muted-foreground italic">
                                Не виконано
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
