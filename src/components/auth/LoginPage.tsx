import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chrome } from "lucide-react";

export function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            💪 Workout Planner
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Керуйте своїми тренуваннями та відстежуйте прогрес
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Увійдіть, щоб почати відстежувати свої тренування
            </p>
          </div>
          <Button onClick={signInWithGoogle} className="w-full" size="lg">
            <Chrome className="mr-2 h-5 w-5" />
            Увійти через Google
          </Button>
          <div className="text-xs text-center text-muted-foreground pt-4">
            <p>✓ AI підказки для ваги</p>
            <p>✓ Історія тренувань</p>
            <p>✓ Графіки прогресу</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
