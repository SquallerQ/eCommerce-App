import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface PublicRouteProps {
  redirectTo?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ redirectTo = "/" }) => {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
