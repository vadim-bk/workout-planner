import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, Timestamp } from "firebase/firestore";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  parseHistoryWorkouts,
  getImportExample,
} from "@/lib/parsers/historyParser";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronLeft,
} from "lucide-react";

export function ImportHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rawText, setRawText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);
  const [showExample, setShowExample] = useState(false);

  const handleImport = async () => {
    if (!rawText.trim() || !user) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      // Парсимо історичні тренування
      const workouts = parseHistoryWorkouts(rawText);

      if (workouts.length === 0) {
        setImportResult({
          success: false,
          message:
            "Не вдалося знайти тренування в тексті. Перевірте формат даних.",
        });
        setIsImporting(false);
        return;
      }

      // Зберігаємо кожне тренування в базу даних
      const historyRef = collection(db, "workout_history");
      let savedCount = 0;

      for (const workout of workouts) {
        await addDoc(historyRef, {
          userId: user.uid,
          date: Timestamp.fromDate(workout.date),
          dayNumber: workout.dayNumber,
          weekPlanId: "imported", // Позначаємо як імпортоване
          exercises: workout.exercises,
          imported: true, // Додатковий маркер
        });
        savedCount++;
      }

      setImportResult({
        success: true,
        message: `✅ Успішно імпортовано ${savedCount} тренувань!`,
        count: savedCount,
      });

      // Очищаємо поле через 2 секунди
      setTimeout(() => {
        setRawText("");
      }, 2000);
    } catch (error: any) {
      console.error("Import error:", error);
      setImportResult({
        success: false,
        message: `❌ Помилка: ${
          error.message || "Не вдалося імпортувати дані"
        }`,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadExample = () => {
    setRawText(getImportExample());
    setShowExample(false);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Імпорт історії тренувань</h1>
            <p className="text-muted-foreground mt-1">
              Додайте дані про минулі тренування для кращих AI підказок
            </p>
          </div>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">Як це працює:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                Вставте дані тренувань за останні 1-2 місяці у форматі нижче
              </li>
              <li>
                AI проаналізує вашу історію і запропонує оптимальні ваги з
                прогресією
              </li>
              <li>Більше даних = точніші підказки для нових тренувань</li>
              <li>
                Можна імпортувати декілька разів (дані додаються, не
                заміняються)
              </li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Import Result */}
        {importResult && (
          <Alert variant={importResult.success ? "success" : "destructive"}>
            {importResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{importResult.message}</AlertDescription>
          </Alert>
        )}

        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle>Вставте дані тренувань</CardTitle>
            <CardDescription>
              Формат: дата, день, вправи з вагами та повтореннями
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Приклад формату:\n\nТиждень: 14.10.2024 - 20.10.2024\n\nДень 1\n1. Присідання зі штангою\n100 кг × 12 \n100 кг × 10 \n\n2. Жим ногами\n150 кг × 15 \n\nДень 2\n1. Жим штанги лежачи\n80 кг × 12 \n\nНатисніть "Показати приклад" для детального формату`}
              className="min-h-[400px] font-mono text-sm"
            />

            <div className="flex gap-3">
              <Button
                onClick={handleImport}
                disabled={!rawText.trim() || isImporting}
                size="lg"
                className="flex-1"
              >
                {isImporting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Імпорт...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Імпортувати тренування
                  </>
                )}
              </Button>

              <Button
                onClick={() => setShowExample(!showExample)}
                variant="outline"
                size="lg"
              >
                <Info className="mr-2 h-4 w-4" />
                {showExample ? "Сховати приклад" : "Показати приклад"}
              </Button>
            </div>

            {showExample && (
              <Card className="bg-muted">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Приклад формату даних
                  </CardTitle>
                  <CardDescription>
                    Можете скопіювати цей приклад і замінити на свої дані
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs whitespace-pre-wrap bg-background p-4 rounded-md overflow-x-auto">
                    {getImportExample()}
                  </pre>
                  <Button
                    onClick={handleLoadExample}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    Завантажити приклад у поле
                  </Button>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Format Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Формат даних</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold mb-1">📅 Тиждень:</p>
                <code className="bg-muted px-2 py-1 rounded">
                  Тиждень: ДД.ММ.РРРР - ДД.ММ.РРРР
                </code>
                <p className="text-muted-foreground mt-1">
                  Приклад:{" "}
                  <code className="bg-muted px-1">
                    Тиждень: 14.10.2024 - 20.10.2024
                  </code>
                </p>
              </div>

              <div>
                <p className="font-semibold mb-1">🗓️ День тренування:</p>
                <code className="bg-muted px-2 py-1 rounded">День 1</code>
                <p className="text-muted-foreground mt-1">
                  Просто номер дня в програмі (1, 2, 3...)
                </p>
              </div>

              <div>
                <p className="font-semibold mb-1">💪 Вправа:</p>
                <code className="bg-muted px-2 py-1 rounded">
                  1. Назва вправи
                </code>
              </div>

              <div>
                <p className="font-semibold mb-1">🏋️ Підходи (новий формат):</p>
                <code className="bg-muted px-2 py-1 rounded block mb-1">
                  100 кг × 12
                </code>
                <code className="bg-muted px-2 py-1 rounded block mb-1">
                  100 кг × 10
                </code>
                <code className="bg-muted px-2 py-1 rounded block">12</code>
                <p className="text-muted-foreground mt-1">
                  Кожен підхід з нового рядку, без "Підхід 1:", "Підхід 2:"
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="font-semibold mb-2">💡 Поради:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Розділяйте різні тижні порожніми рядками або "---"</li>
                  <li>Можна використовувати × або x для множення</li>
                  <li>Підтримуються десяткові ваги: 52.5 кг або 52,5 кг</li>
                  <li>
                    Імпортуйте тренування за останні 1-2 місяці для кращих
                    результатів
                  </li>
                  <li>
                    Новий формат простіший - не треба писати "Підхід 1:",
                    "Підхід 2:"
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
