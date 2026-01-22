import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/authContext";

interface PublicRouteProps {
  redirectTo?: string;
}

export const PrivateRoute: React.FC<PublicRouteProps> = ({ redirectTo = "/" }) => {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
