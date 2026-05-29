import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthStatus } from "../../features/auth/useAuth";
import { Spinner } from "../../shared/ui/Spinner";

type ProtectedRouteProps = {
  adminOnly?: boolean;
};

export function ProtectedRoute({ adminOnly = false }: ProtectedRouteProps) {
  const location = useLocation();
  const { data: auth, isLoading } = useAuthStatus();

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Spinner label="Проверяем сессию" />
      </div>
    );
  }

  if (!auth?.authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (adminOnly && !auth.admin) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
