import { Calendar, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { WorkoutHistory } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkoutHistory } from '@/entities/workoutHistory';
import { formatShortDate } from '@/lib/date';
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
} from '@/shared/ui';

export const HistoryPage = () => {
  const { user } = useAuth();
  const { data: history = [], isLoading, error } = useWorkoutHistory(user?.uid);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const exerciseNames = Array.from(
    new Set(history.flatMap((workout) => workout.exercises.map((ex) => ex.name)))
  ).sort();

  const getWeeklyWorkouts = () => {
    const weeks: Array<{
      startDate: Date;
      endDate: Date;
      workouts: WorkoutHistory[];
    }> = [];

    const groupedByWeek = new Map<string, WorkoutHistory[]>();

    history.forEach((workout) => {
      const date = new Date(workout.date);
      const monday = new Date(date);
      monday.setDate(date.getDate() - date.getDay() + 1);
      const weekKey = monday.toISOString().split('T')[0];

      if (!groupedByWeek.has(weekKey)) {
        groupedByWeek.set(weekKey, []);
      }
      groupedByWeek.get(weekKey)!.push(workout);
    });

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

  const getChartData = (exerciseName: string) => {
    const data: { date: string; maxWeight: number; avgWeight: number }[] = [];

    history
      .slice()
      .reverse()
      .forEach((workout) => {
        const exercise = workout.exercises.find((ex) => ex.name === exerciseName);
        if (exercise) {
          const weights = exercise.sets.map((s) => s.weight).filter((w) => w > 0);
          if (weights.length > 0) {
            const maxWeight = Math.max(...weights);
            const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;

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

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Історія тренувань</h1>
          <p className="text-muted-foreground mt-1">Переглядайте ваш прогрес та статистику</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Помилка завантаження історії: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Історія тренувань</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Переглядайте ваш прогрес та статистику</p>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Немає історії</h2>
            <p className="text-muted-foreground">Виконайте ваше перше тренування, щоб побачити статистику</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Виберіть вправу для графіку</CardTitle>
              <CardDescription>Перегляньте прогрес по конкретній вправі</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {exerciseNames.map((name) => (
                  <Button
                    key={name}
                    variant={selectedExercise === name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedExercise(name)}
                    className="justify-start text-left h-auto py-2 px-2 sm:px-3"
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
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <LineChart data={getChartData(selectedExercise)}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />

                    <YAxis
                      label={{
                        value: 'Вага (кг)',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                      tick={{ fontSize: 12 }}
                    />

                    <Tooltip />

                    <Legend wrapperStyle={{ fontSize: '12px' }} />

                    <Line type="monotone" dataKey="maxWeight" stroke="#3b82f6" name="Макс. вага" strokeWidth={2} />

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
                Всі тренування згруповані по тижнях. Натисніть на тиждень щоб розгорнути.
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
                            Тиждень {week.startDate.toLocaleDateString('uk-UA')} -{' '}
                            {week.endDate.toLocaleDateString('uk-UA')}
                          </h3>

                          <p className="text-sm text-muted-foreground">{week.workouts.length} тренувань</p>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent>
                      <div className="grid gap-3 pt-2">
                        {week.workouts.map((workout) => (
                          <div key={workout.id} className="bg-muted/50 rounded-md p-3 border">
                            <div className="mb-2">
                              <h4 className="font-semibold">День {workout.dayNumber}</h4>
                            </div>

                            <div className="space-y-2">
                              {workout.exercises.map((ex: any, idx: number) => (
                                <div key={idx} className="text-sm">
                                  <p className="font-medium text-sm">
                                    {idx + 1}. {ex.name}
                                  </p>

                                  <div className="flex flex-col gap-1 mt-1">
                                    {ex.sets.map((set: any, setIdx: number) => (
                                      <div
                                        key={setIdx}
                                        className="text-xs text-muted-foreground list-disc list-inside ml-4"
                                      >
                                        {set.weight > 0 ? (
                                          <span>
                                            {set.weight} кг × {set.reps}{' '}
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
};
