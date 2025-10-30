import { Home, Plus, History, LogOut, Upload } from 'lucide-react';
import { Outlet, useNavigate, Link } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/shared/ui';

type NavigationItem = {
  label: string;
  IconComponent: React.ElementType;
  to: string;
};

const navigationItems: NavigationItem[] = [
  {
    label: 'Головна',
    IconComponent: Home,
    to: '/',
  },

  {
    label: 'Новий план',
    IconComponent: Plus,
    to: '/new-plan',
  },
  {
    label: 'Імпорт історії',
    IconComponent: Upload,
    to: '/import-history',
  },
  {
    label: 'Історія',
    IconComponent: History,
    to: '/history',
  },
];

export const Layout = () => {
  const navigate = useNavigate();

  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
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
              {navigationItems.map((item) => (
                <Link key={item.to} to={item.to}>
                  <Button variant="ghost" size="sm">
                    <item.IconComponent className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}

              <div className="flex items-center gap-2 ml-4 pl-4 border-l">
                {user?.photoURL && (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="h-8 w-8 rounded-full" />
                )}

                <span className="text-sm hidden md:inline">{user?.displayName || user?.email}</span>

                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};
