import { Dumbbell, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { Button, Card, CardContent } from '@/shared/ui';

export const EmptyPlan = () => {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Dumbbell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />

        <h2 className="text-2xl font-bold mb-2">Немає активних планів</h2>

        <p className="text-muted-foreground mb-6">Почніть додаванням вашого першого плану тренувань</p>

        <Link to="/new-plan">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Створити план тренувань
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
