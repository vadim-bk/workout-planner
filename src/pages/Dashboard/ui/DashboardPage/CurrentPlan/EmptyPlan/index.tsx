import { Dumbbell, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { Button, Card, CardContent } from '@/shared/ui';

export const EmptyPlan = () => {
  return (
    <Card>
      <CardContent className="py-8 sm:py-12 text-center">
        <Dumbbell className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />

        <h2 className="text-xl sm:text-2xl font-bold mb-2">Немає активних планів</h2>

        <p className="text-sm sm:text-base text-muted-foreground mb-6">
          Почніть додаванням вашого першого плану тренувань
        </p>

        <Link to="/new-plan" className="inline-block w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto">
            <Plus className="mr-2 h-5 w-5" />
            Створити план тренувань
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
