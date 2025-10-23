import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Home, Plus, History, LogOut, Upload } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold flex items-center gap-2">
              💪 Workout Planner
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Головна
                </Button>
              </Link>
              <Link to="/new-plan">
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Новий план
                </Button>
              </Link>
              <Link to="/import-history">
                <Button variant="ghost" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Імпорт історії
                </Button>
              </Link>
              <Link to="/history">
                <Button variant="ghost" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  Історія
                </Button>
              </Link>
              <div className="flex items-center gap-2 ml-4 pl-4 border-l">
                {user?.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="text-sm hidden md:inline">
                  {user?.displayName || user?.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
