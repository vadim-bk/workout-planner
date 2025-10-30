import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { useCurrentPlan } from '../../api/useCurrentPlan';
import { CurrentPlan } from './CurrentPlan';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/shared/ui';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { data: currentPlan, isLoading: loading, error } = useCurrentPlan(user?.uid);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Головна</h1>

          <p className="text-muted-foreground mt-1">Вітаємо, {user?.displayName?.split(' ')[0] || 'спортсмене'}! 💪</p>
        </div>

        <Link to="/new-plan">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Додати новий план
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Помилка завантаження плану: {error.message}</p>
        </div>
      )}

      <CurrentPlan isLoading={loading} currentPlan={currentPlan || null} />
    </div>
  );
};
