import { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth, UserRole, HOME_ROUTE_BY_ROLE } from "../../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role gak sesuai, lempar ke halaman utama role dia sendiri, bukan ke signin
    return <Navigate to={HOME_ROUTE_BY_ROLE[user.role]} replace />;
  }

  return <>{children}</>;
}