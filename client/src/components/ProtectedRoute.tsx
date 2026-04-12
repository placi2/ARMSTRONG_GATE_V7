import { ReactNode, useEffect } from "react";
import { UserRole } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  requiredPermission?: string;
}

export default function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermission,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Check role-based access
    if (requiredRoles && !hasRole(requiredRoles)) {
      navigate("/unauthorized");
      return;
    }

    // Check permission-based access
    if (requiredPermission && !hasPermission(requiredPermission)) {
      navigate("/unauthorized");
      return;
    }
  }, [isAuthenticated, isLoading, user, requiredRoles, requiredPermission, navigate, hasRole, hasPermission]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}
