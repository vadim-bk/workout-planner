import { Sparkles, Eye, Save } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { useGenerateWeightSuggestions } from '../../api/useGenerateWeightSuggestions';
import { useSaveAISuggestions } from '../../api/useSaveAISuggestions';
import { useSaveWorkoutPlan } from '../../api/useSaveWorkoutPlan';
import type { WeeklyPlan } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkoutHistory } from '@/entities/workoutHistory';
import { parseWorkoutPlan } from '@/lib/parsers/workoutParser';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Textarea,
  Input,
  Alert,
  AlertDescription,
} from '@/shared/ui';

export const NewPlanPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, getValues, formState } = useForm({
    mode: 'onChange',
    defaultValues: {
      weekStart: '',
      weekEnd: '',
      rawText: '',
    },
  });
  const [parsedPlan, setParsedPlan] = useState<WeeklyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveWorkoutPlan = useSaveWorkoutPlan();
  const saveAISuggestions = useSaveAISuggestions();
  const generateWeightSuggestions = useGenerateWeightSuggestions();
  const { data: workoutHistory = [] } = useWorkoutHistory(user?.uid);

  const handleParse = () => {
    const { rawText, weekStart, weekEnd } = getValues();
    if (!rawText || !weekStart || !weekEnd || !user) return;

    setError(null);
    const days = parseWorkoutPlan(rawText);

    if (days.length === 0) {
      setError('Не вдалося розпізнати план. Переконайтеся, що текст містить "День 1", "День 2" тощо.');
      return;
    }

    const plan: WeeklyPlan = {
      id: '',
      userId: user.uid,
      weekStartDate: new Date(weekStart),
      weekEndDate: new Date(weekEnd),
      days,
      rawText,
      createdAt: new Date(),
    };

    setParsedPlan(plan);
  };

  const handleSaveWithoutAI = () => {
    if (!parsedPlan || !user) return;
    setError(null);
    saveWorkoutPlan.mutate(parsedPlan, {
      onSuccess: () => {
        navigate('/');
      },
      onError: () => {
        setError('Помилка при збереженні плану. Перевірте налаштування Firebase.');
      },
    });
  };

  const handleSaveAndGenerateAI = () => {
    if (!parsedPlan || !user) return;
    setError(null);
    saveWorkoutPlan.mutate(parsedPlan, {
      onSuccess: (savedPlan) => {
        generateWeightSuggestions.mutate(
          { newPlan: savedPlan, workoutHistory },
          {
            onSuccess: (suggestionsMap) => {
              const suggestions = Array.from(suggestionsMap.values());
              saveAISuggestions.mutate(suggestions, {
                onSuccess: () => {
                  navigate('/');
                },
                onError: () => {
                  setError('Помилка при збереженні плану. Перевірте налаштування Firebase та OpenAI API.');
                },
              });
            },
            onError: (err: unknown) => {
              const message = (err as { status?: number; message?: string }) || {};
              const errorMessage = message.message || '';

              if (errorMessage.includes('API key is not configured') || errorMessage.includes('VITE_OPENAI_API_KEY')) {
                setError(
                  '❌ OpenAI API ключ не налаштовано. Натисніть "Зберегти без AI підказок" або налаштуйте API ключ для використання AI функцій.'
                );
              } else if (message.status === 429 || errorMessage.includes('429') || errorMessage.includes('quota')) {
                setError(
                  "❌ OpenAI Rate Limit: У вас закінчилися кредити. Додайте кредити на platform.openai.com/settings/organization/billing або натисніть 'Зберегти без AI' нижче."
                );
              } else if (errorMessage.includes('OpenAI') || errorMessage.includes('API')) {
                setError('❌ Помилка OpenAI API. Перевірте ключ у .env файлі або збережіть без AI підказок.');
              } else {
                setError('Помилка при збереженні плану. Перевірте налаштування Firebase та OpenAI API.');
              }
            },
          }
        );
      },
      onError: () => {
        setError('Помилка при збереженні плану. Перевірте налаштування Firebase.');
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Новий план тренувань</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Вставте текст плану від вашого тренера</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Введіть план тренувань</CardTitle>

          <CardDescription>Скопіюйте текст з сайту тренера та вставте нижче</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="weekStart" className="text-sm font-medium mb-2 block">
                Початок тижня
              </label>

              <Input id="weekStart" type="date" {...register('weekStart', { required: true })} />
            </div>

            <div>
              <label htmlFor="weekEnd" className="text-sm font-medium mb-2 block">
                Кінець тижня
              </label>

              <Input id="weekEnd" type="date" {...register('weekEnd', { required: true })} />
            </div>
          </div>

          <div>
            <label htmlFor="rawText" className="text-sm font-medium mb-2 block">
              Текст плану
            </label>

            <Textarea
              id="rawText"
              {...register('rawText', { required: true })}
              placeholder="День 1&#10;&#10;1. Бруси&#10;За потреби беріть додаткову вагу 3 підходів по 5-8 &#10;&#10;2. Тяга однієї гантелі під нахилом&#10;3 підходи по 6-10 &#10;..."
              className="min-h-[200px] sm:min-h-[300px] font-mono text-xs sm:text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleParse} disabled={!formState.isValid} variant="outline">
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

            <CardDescription>Перевірте правильність розпізнавання</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4 sm:space-y-6">
              {parsedPlan.days.map((day) => (
                <div key={day.day} className="border rounded-lg p-3 sm:p-4">
                  <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3">День {day.day}</h3>

                  <div className="space-y-2">
                    {day.exercises.map((ex, idx) => (
                      <div key={ex.id} className="flex items-start gap-2 text-xs sm:text-sm">
                        <span className="font-medium text-muted-foreground min-w-6">{idx + 1}.</span>

                        <div className="flex-1">
                          <p className="font-medium">{ex.name}</p>

                          <p className="text-muted-foreground">
                            {ex.sets} підходи × {ex.reps}
                            {ex.type !== 'normal' && ex.type && (
                              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {ex.type === 'superset' ? 'Суперсет' : 'Дропсет'}
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

            <div className="mt-4 sm:mt-6 flex flex-col gap-3">
              <Button
                onClick={handleSaveAndGenerateAI}
                disabled={
                  generateWeightSuggestions.isPending || saveWorkoutPlan.isPending || saveAISuggestions.isPending
                }
                size="lg"
                className="w-full text-sm sm:text-base"
              >
                {generateWeightSuggestions.isPending || saveWorkoutPlan.isPending || saveAISuggestions.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Генерація AI підказок...</span>
                    <span className="sm:hidden">Генерація...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Зберегти та отримати AI підказки</span>
                    <span className="sm:hidden">Зберегти з AI</span>
                  </>
                )}
              </Button>

              <Button
                onClick={handleSaveWithoutAI}
                disabled={saveWorkoutPlan.isPending}
                size="lg"
                variant="outline"
                className="w-full text-sm sm:text-base"
              >
                <Save className="mr-2 h-4 w-4" />
                Зберегти без AI підказок
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                💡 Підказка: AI підказки можна додати пізніше, або ввести вагу вручну
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
