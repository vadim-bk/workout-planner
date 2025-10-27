import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Loader,
} from "@/shared/ui";
import { WorkoutHistory } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Calendar, TrendingUp } from "lucide-react";
import { formatShortDate } from "@/lib/utils";

export function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<WorkoutHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      const historyRef = collection(db, "workout_history");
      const q = query(
        historyRef,
        where("userId", "==", user.uid),
        orderBy("date", "desc")
      );

      const snapshot = await getDocs(q);
      const workouts: WorkoutHistory[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      })) as WorkoutHistory[];

      setHistory(workouts);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique exercise names
  const exerciseNames = Array.from(
    new Set(
      history.flatMap((workout) => workout.exercises.map((ex) => ex.name))
    )
  ).sort();

  // Group workouts by week
  const getWeeklyWorkouts = () => {
    const weeks: Array<{
      startDate: Date;
      endDate: Date;
      workouts: WorkoutHistory[];
    }> = [];

    // Group by week (Monday to Sunday)
    const groupedByWeek = new Map<string, WorkoutHistory[]>();

    history.forEach((workout) => {
      const date = new Date(workout.date);
      const monday = new Date(date);
      monday.setDate(date.getDate() - date.getDay() + 1); // Get Monday of the week
      const weekKey = monday.toISOString().split("T")[0];

      if (!groupedByWeek.has(weekKey)) {
        groupedByWeek.set(weekKey, []);
      }
      groupedByWeek.get(weekKey)!.push(workout);
    });

    // Convert to week objects
    groupedByWeek.forEach((workouts, weekKey) => {
      const monday = new Date(weekKey);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      weeks.push({
        startDate: monday,
        endDate: sunday,
        workouts: workouts.sort((a, b) => a.dayNumber - b.dayNumber),
      });
    });

    return weeks.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  };

  // Prepare chart data for selected exercise
  const getChartData = (exerciseName: string) => {
    const data: { date: string; maxWeight: number; avgWeight: number }[] = [];

    history
      .slice()
      .reverse()
      .forEach((workout) => {
        const exercise = workout.exercises.find(
          (ex) => ex.name === exerciseName
        );
        if (exercise) {
          const weights = exercise.sets
            .map((s) => s.weight)
            .filter((w) => w > 0);
          if (weights.length > 0) {
            const maxWeight = Math.max(...weights);
            const avgWeight =
              weights.reduce((a, b) => a + b, 0) / weights.length;

            data.push({
              date: formatShortDate(workout.date),
              maxWeight: Math.round(maxWeight * 10) / 10,
              avgWeight: Math.round(avgWeight * 10) / 10,
            });
          }
        }
      });

    return data;
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Історія тренувань</h1>
        <p className="text-muted-foreground mt-1">
          Переглядайте ваш прогрес та статистику
        </p>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Немає історії</h2>
            <p className="text-muted-foreground">
              Виконайте ваше перше тренування, щоб побачити статистику
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Виберіть вправу для графіку</CardTitle>
              <CardDescription>
                Перегляньте прогрес по конкретній вправі
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {exerciseNames.map((name) => (
                  <Button
                    key={name}
                    variant={selectedExercise === name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedExercise(name)}
                    className="justify-start text-left h-auto py-2 px-3"
                  >
                    <span className="truncate text-xs">{name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedExercise && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Прогрес: {selectedExercise}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getChartData(selectedExercise)}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="date" />

                    <YAxis
                      label={{
                        value: "Вага (кг)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />

                    <Tooltip />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="maxWeight"
                      stroke="#3b82f6"
                      name="Макс. вага"
                      strokeWidth={2}
                    />

                    <Line
                      type="monotone"
                      dataKey="avgWeight"
                      stroke="#10b981"
                      name="Сер. вага"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Тренування по тижнях</CardTitle>

              <CardDescription>
                Всі тренування згруповані по тижнях. Натисніть на тиждень щоб
                розгорнути.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Accordion type="multiple" className="w-full">
                {getWeeklyWorkouts().map((week, weekIdx) => (
                  <AccordionItem key={weekIdx} value={`week-${weekIdx}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="text-left">
                          <h3 className="font-bold text-lg">
                            Тиждень {week.startDate.toLocaleDateString("uk-UA")}{" "}
                            - {week.endDate.toLocaleDateString("uk-UA")}
                          </h3>

                          <p className="text-sm text-muted-foreground">
                            {week.workouts.length} тренувань
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent>
                      <div className="grid gap-3 pt-2">
                        {week.workouts.map((workout) => (
                          <div
                            key={workout.id}
                            className="bg-muted/50 rounded-md p-3 border"
                          >
                            <div className="mb-2">
                              <h4 className="font-semibold">
                                День {workout.dayNumber}
                              </h4>
                            </div>

                            <div className="space-y-2">
                              {workout.exercises.map((ex, idx) => (
                                <div key={idx} className="text-sm">
                                  <p className="font-medium text-sm">
                                    {idx + 1}. {ex.name}
                                  </p>

                                  <div className="flex flex-col gap-1 mt-1">
                                    {ex.sets.map((set, setIdx) => (
                                      <div
                                        key={setIdx}
                                        className="text-xs text-muted-foreground list-disc list-inside ml-4"
                                      >
                                        {set.weight > 0 ? (
                                          <span>
                                            {set.weight} кг × {set.reps}{" "}
                                          </span>
                                        ) : (
                                          <span>{set.reps} </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
