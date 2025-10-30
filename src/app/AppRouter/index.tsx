import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { Layout } from '../Layout';
import { AuthPermission, ProtectedRoute } from './ProtectedRoute';
import type { RouteObject } from 'react-router';
import { LogIn } from '@/pages/LogIn';

const dashboardPage: RouteObject = {
  path: '/',
  lazy: () =>
    import('@/pages/Dashboard').then((module) => ({
      Component: module.DashboardPage,
    })),
};

const newPlanPage: RouteObject = {
  path: '/new-plan',
  lazy: () =>
    import('@/pages/NewPlan').then((module) => ({
      Component: module.NewPlanPage,
    })),
};

const workoutPage: RouteObject = {
  path: '/workout/:planId/:day',
  lazy: () =>
    import('@/pages/Workout').then((module) => ({
      Component: module.WorkoutPage,
    })),
};

const historyPage: RouteObject = {
  path: '/history',
  lazy: () =>
    import('@/pages/History').then((module) => ({
      Component: module.HistoryPage,
    })),
};

const importHistoryPage: RouteObject = {
  path: '/import-history',
  lazy: () =>
    import('@/pages/ImportHistory').then((module) => ({
      Component: module.ImportHistoryPage,
    })),
};

const router = createBrowserRouter(
  [
    {
      element: <ProtectedRoute permission={AuthPermission.NO_AUTH} />,
      children: [{ path: '/login', element: <LogIn /> }],
    },

    {
      element: <ProtectedRoute permission={AuthPermission.AUTH} />,
      children: [
        {
          element: <Layout />,
          children: [dashboardPage, newPlanPage, workoutPage, historyPage, importHistoryPage],
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);

export const AppRouter = () => <RouterProvider router={router} />;
