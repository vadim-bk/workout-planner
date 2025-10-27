import { useEffect, useState } from "react";
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
import { Button } from "@/shared/ui";
import { WeeklyPlan } from "@/types";
import { Plus } from "lucide-react";
import { CurrentPlan } from "./CurrentPlan";
import { Link } from "react-router";

export const Dashboard = () => {
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

      <CurrentPlan isLoading={loading} currentPlan={currentPlan} />
    </div>
  );
};
