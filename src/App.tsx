import { Route, Routes, Navigate } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import RepoSubmissions from "@/pages/RepoSubmissions";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        }
      />
      <Route
        path="/repos/:repoId"
        element={
          <AuthGuard>
            <RepoSubmissions />
          </AuthGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
