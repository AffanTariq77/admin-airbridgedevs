import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isSignedIn } from "@/lib/auth";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation();

  if (!isSignedIn()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
