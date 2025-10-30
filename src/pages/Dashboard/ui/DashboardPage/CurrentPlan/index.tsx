import { Plus, Calendar, History as HistoryIcon } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyPlan } from './EmptyPlan';
import type { WeeklyPlan } from '@/types';
import { formatShortDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Loader, Button } from '@/shared/ui';

type Props = {
  isLoading: boolean;
  currentPlan: WeeklyPlan | null;
};

export const CurrentPlan = ({ currentPlan, isLoading }: Props) => {
  if (isLoading) {
    return <Loader />;
  }

  if (!currentPlan) {
    return <EmptyPlan />;
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Поточний план тренувань</CardTitle>

                <CardDescription className="text-base mt-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  {formatShortDate(currentPlan.weekStartDate)} - {formatShortDate(currentPlan.weekEndDate)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {currentPlan.days.map((day) => (
                <Link key={day.day} to={`/workout/${currentPlan.id}/${day.day}`}>
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle>День {day.day}</CardTitle>
                      <CardDescription>{day.exercises.length} вправ</CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-1">
                        {day.exercises.slice(0, 3).map((ex, idx) => (
                          <p key={idx} className="text-sm truncate">
                            {idx + 1}. {ex.name}
                          </p>
                        ))}

                        {day.exercises.length > 3 && (
                          <p className="text-xs text-muted-foreground">+{day.exercises.length - 3} ще...</p>
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
    </>
  );
};
