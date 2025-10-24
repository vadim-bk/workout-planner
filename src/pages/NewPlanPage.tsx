import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseWorkoutPlan } from "@/lib/parsers/workoutParser";
import { generateWeightSuggestions } from "@/lib/openai/suggestions";
import { WeeklyPlan, WorkoutHistory } from "@/types";
import { Sparkles, Eye, Save } from "lucide-react";

export function NewPlanPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rawText, setRawText] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [parsedPlan, setParsedPlan] = useState<WeeklyPlan | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    if (!rawText || !weekStart || !weekEnd || !user) return;

    setError(null);
    const days = parseWorkoutPlan(rawText);

    if (days.length === 0) {
      setError(
        'Не вдалося розпізнати план. Переконайтеся, що текст містить "День 1", "День 2" тощо.'
      );
      return;
    }

    const plan: WeeklyPlan = {
      id: "",
      userId: user.uid,
      weekStartDate: new Date(weekStart),
      weekEndDate: new Date(weekEnd),
      days,
      rawText,
      createdAt: new Date(),
    };

    setParsedPlan(plan);
  };

  const handleSaveWithoutAI = async () => {
    if (!parsedPlan || !user) return;

    setIsSaving(true);
    setError(null);

    try {
      // Save the plan to Firestore
      const plansRef = collection(db, "workout_plans");
      await addDoc(plansRef, {
        userId: parsedPlan.userId,
        weekStartDate: Timestamp.fromDate(parsedPlan.weekStartDate),
        weekEndDate: Timestamp.fromDate(parsedPlan.weekEndDate),
        days: parsedPlan.days,
        rawText: parsedPlan.rawText,
        createdAt: Timestamp.fromDate(parsedPlan.createdAt),
      });

      navigate("/");
    } catch (error) {
      console.error("Error saving plan:", error);
      setError(
        "Помилка при збереженні плану. Перевірте налаштування Firebase."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndGenerateAI = async () => {
    if (!parsedPlan || !user) return;

    setIsGeneratingAI(true);
    setIsSaving(true);
    setError(null);

    try {
      // Save the plan to Firestore
      const plansRef = collection(db, "workout_plans");
      const docRef = await addDoc(plansRef, {
        userId: parsedPlan.userId,
        weekStartDate: Timestamp.fromDate(parsedPlan.weekStartDate),
        weekEndDate: Timestamp.fromDate(parsedPlan.weekEndDate),
        days: parsedPlan.days,
        rawText: parsedPlan.rawText,
        createdAt: Timestamp.fromDate(parsedPlan.createdAt),
      });

      const planWithId = { ...parsedPlan, id: docRef.id };

      // Load workout history
      const historyRef = collection(db, "workout_history");
      const historyQuery = query(
        historyRef,
        where("userId", "==", user.uid),
        orderBy("date", "desc")
      );

      const historySnapshot = await getDocs(historyQuery);
      const history: WorkoutHistory[] = historySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      })) as WorkoutHistory[];

      // Generate AI suggestions
      const suggestions = await generateWeightSuggestions(planWithId, history);

      // Save suggestions to Firestore
      const suggestionsRef = collection(db, "ai_suggestions");
      const savePromises = Array.from(suggestions.values()).map((suggestion) =>
        addDoc(suggestionsRef, {
          userId: suggestion.userId,
          weekPlanId: suggestion.weekPlanId,
          exerciseName: suggestion.exerciseName,
          suggestedWeights: suggestion.suggestedWeights,
          reasoning: suggestion.reasoning,
          createdAt: Timestamp.fromDate(suggestion.createdAt),
        })
      );

      await Promise.all(savePromises);

      navigate("/");
    } catch (error: any) {
      console.error("Error saving plan:", error);

      // Better error handling for OpenAI rate limits
      if (
        error?.status === 429 ||
        error?.message?.includes("429") ||
        error?.message?.includes("quota")
      ) {
        setError(
          "❌ OpenAI Rate Limit: У вас закінчилися кредити. Додайте кредити на platform.openai.com/settings/organization/billing або натисніть 'Зберегти без AI' нижче."
        );
      } else if (
        error?.message?.includes("OpenAI") ||
        error?.message?.includes("API")
      ) {
        setError(
          "❌ Помилка OpenAI API. Перевірте ключ у .env файлі або збережіть без AI підказок."
        );
      } else {
        setError(
          "Помилка при збереженні плану. Перевірте налаштування Firebase та OpenAI API."
        );
      }
    } finally {
      setIsGeneratingAI(false);
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Новий план тренувань</h1>
          <p className="text-muted-foreground mt-1">
            Вставте текст плану від вашого тренера
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Введіть план тренувань</CardTitle>
            <CardDescription>
              Скопіюйте текст з сайту тренера та вставте нижче
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Початок тижня
                </label>
                <Input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Кінець тижня
                </label>
                <Input
                  type="date"
                  value={weekEnd}
                  onChange={(e) => setWeekEnd(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Текст плану
              </label>
              <Textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="День 1&#10;&#10;1. Бруси&#10;За потреби беріть додаткову вагу 3 підходів по 5-8 &#10;&#10;2. Тяга однієї гантелі під нахилом&#10;3 підходи по 6-10 &#10;..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleParse}
                disabled={!rawText || !weekStart || !weekEnd}
                variant="outline"
              >
                <Eye className="mr-2 h-4 w-4" />
                Переглянути план
              </Button>
            </div>
          </CardContent>
        </Card>

        {parsedPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Розпізнаний план</CardTitle>
              <CardDescription>
                Перевірте правильність розпізнавання
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {parsedPlan.days.map((day) => (
                  <div key={day.day} className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3">День {day.day}</h3>
                    <div className="space-y-2">
                      {day.exercises.map((ex, idx) => (
                        <div
                          key={ex.id}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="font-medium text-muted-foreground min-w-6">
                            {idx + 1}.
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">{ex.name}</p>
                            <p className="text-muted-foreground">
                              {ex.sets} підходи × {ex.reps}
                              {ex.type !== "normal" && ex.type && (
                                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  {ex.type === "superset"
                                    ? "Суперсет"
                                    : "Дропсет"}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Button
                  onClick={handleSaveAndGenerateAI}
                  disabled={isGeneratingAI || isSaving}
                  size="lg"
                  className="w-full"
                >
                  {isGeneratingAI ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      Генерація AI підказок...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Зберегти та отримати AI підказки
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleSaveWithoutAI}
                  disabled={isSaving}
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Зберегти без AI підказок
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  💡 Підказка: AI підказки можна додати пізніше, або ввести вагу
                  вручну
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
