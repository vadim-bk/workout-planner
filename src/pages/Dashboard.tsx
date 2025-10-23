import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
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
import { WeeklyPlan } from "@/types";
import { Plus, Dumbbell, Calendar, History as HistoryIcon } from "lucide-react";
import { formatShortDate } from "@/lib/utils";

export function Dashboard() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentPlan();
  }, [user]);

  const loadCurrentPlan = async () => {
    if (!user) return;

    try {
      const plansRef = collection(db, "workout_plans");
      const q = query(
        plansRef,
        where("userId", "==", user.uid),
        orderBy("weekStartDate", "desc"),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setCurrentPlan({
          id: doc.id,
          ...doc.data(),
          weekStartDate: doc.data().weekStartDate.toDate(),
          weekEndDate: doc.data().weekEndDate.toDate(),
          createdAt: doc.data().createdAt.toDate(),
        } as WeeklyPlan);
      }
    } catch (error) {
      console.error("Error loading current plan:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Головна</h1>
            <p className="text-muted-foreground mt-1">
              Вітаємо, {user?.displayName?.split(" ")[0] || "спортсмене"}! 💪
            </p>
          </div>
          <Link to="/new-plan">
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Додати новий план
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Завантаження...</p>
          </div>
        ) : currentPlan ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      Поточний план тренувань
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      {formatShortDate(currentPlan.weekStartDate)} -{" "}
                      {formatShortDate(currentPlan.weekEndDate)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {currentPlan.days.map((day) => (
                    <Link
                      key={day.day}
                      to={`/workout/${currentPlan.id}/${day.day}`}
                    >
                      <Card className="hover:border-primary transition-colors cursor-pointer">
                        <CardHeader>
                          <CardTitle>День {day.day}</CardTitle>
                          <CardDescription>
                            {day.exercises.length} вправ
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            {day.exercises.slice(0, 3).map((ex, idx) => (
                              <p key={idx} className="text-sm truncate">
                                {idx + 1}. {ex.name}
                              </p>
                            ))}
                            {day.exercises.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{day.exercises.length - 3} ще...
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Швидкі дії</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/new-plan">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" />
                    Додати новий план
                  </Button>
                </Link>
                <Link to="/history">
                  <Button variant="outline" className="w-full justify-start">
                    <HistoryIcon className="mr-2 h-4 w-4" />
                    Переглянути історію
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Про додаток</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>📝 Вставляйте плани тренувань від вашого тренера</p>
                <p>🤖 Отримуйте AI підказки для ваги на основі вашої історії</p>
                <p>💪 Редагуйте вагу під час тренування</p>
                <p>📊 Відстежуйте прогрес з графіками</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Dumbbell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Немає активних планів</h2>
              <p className="text-muted-foreground mb-6">
                Почніть додаванням вашого першого плану тренувань
              </p>
              <Link to="/new-plan">
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Створити план тренувань
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
