import { Dashboard } from "@/pages/Dashboard";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { AuthPermission, ProtectedRoute } from "./ProtectedRoute";
import { Layout } from "../Layout";
import { LogIn } from "@/pages/LogIn";
import { HistoryPage } from "@/pages/HistoryPage";
import { ImportHistoryPage } from "@/pages/ImportHistoryPage";
import { Workout } from "@/pages/Workout";
import { NewPlanPage } from "@/pages/NewPlanPage";

const router = createBrowserRouter([
  {
    element: <ProtectedRoute permission={AuthPermission.NO_AUTH} />,
    children: [{ path: "/login", element: <LogIn /> }],
  },

  {
    element: <ProtectedRoute permission={AuthPermission.AUTH} />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/", element: <Dashboard /> },

          { path: "/new-plan", element: <NewPlanPage /> },

          { path: "/workout/:planId/:day", element: <Workout /> },

          { path: "/history", element: <HistoryPage /> },

          { path: "/import-history", element: <ImportHistoryPage /> },
        ],
      },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
