import { Route, Routes, Navigate } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import Dashboard from "@/pages/Dashboard";
import Attribution from "@/pages/Attribution";
import Login from "@/pages/Login";
import RepoSubmissions from "@/pages/RepoSubmissions";
import FormSubmissions from "@/pages/FormSubmissions";
import ContactMessages from "@/pages/ContactMessages";
import Blog from "@/pages/Blog";

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
      <Route
        path="/attribution"
        element={
          <AuthGuard>
            <Attribution />
          </AuthGuard>
        }
      />
      <Route
        path="/form-submissions"
        element={
          <AuthGuard>
            <FormSubmissions />
          </AuthGuard>
        }
      />
      <Route
        path="/contact-messages"
        element={
          <AuthGuard>
            <ContactMessages />
          </AuthGuard>
        }
      />
      <Route
        path="/blog"
        element={
          <AuthGuard>
            <Blog />
          </AuthGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
