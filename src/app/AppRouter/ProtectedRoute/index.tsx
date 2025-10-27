import { Loader } from "@/shared/ui";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router";

export enum AuthPermission {
  AUTH = "auth",
  NO_AUTH = "no_auth",
}

type Props = {
  permission: AuthPermission;
};

export const ProtectedRoute = ({ permission }: Props) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loader />;
  }

  if (permission === AuthPermission.AUTH && !user) {
    return <Navigate to="/login" replace />;
  }

  if (permission === AuthPermission.NO_AUTH && user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
