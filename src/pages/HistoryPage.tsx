import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkoutHistory } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';
import { formatShortDate } from '@/lib/utils';

export function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<WorkoutHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      const historyRef = collection(db, 'workout_history');
      const q = query(
        historyRef,
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      const workouts: WorkoutHistory[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      })) as WorkoutHistory[];

      setHistory(workouts);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique exercise names
  const exerciseNames = Array.from(
    new Set(
      history.flatMap(workout =>
        workout.exercises.map(ex => ex.name)
      )
    )
  ).sort();

  // Prepare chart data for selected exercise
  const getChartData = (exerciseName: string) => {
    const data: { date: string; maxWeight: number; avgWeight: number }[] = [];

    history
      .slice()
      .reverse()
      .forEach(workout => {
        const exercise = workout.exercises.find(ex => ex.name === exerciseName);
        if (exercise) {
          const weights = exercise.sets.map(s => s.weight).filter(w => w > 0);
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
                  {exerciseNames.map(name => (
                    <Button
                      key={name}
                      variant={selectedExercise === name ? 'default' : 'outline'}
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
                      <YAxis label={{ value: 'Вага (кг)', angle: -90, position: 'insideLeft' }} />
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
                <CardTitle>Останні тренування</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {history.slice(0, 10).map(workout => (
                    <div key={workout.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold">День {workout.dayNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatShortDate(workout.date)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {workout.exercises.map((ex, idx) => (
                          <div key={idx} className="text-sm">
                            <p className="font-medium">{ex.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {ex.sets.map(s => `${s.weight}кг × ${s.reps}`).join(', ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}

