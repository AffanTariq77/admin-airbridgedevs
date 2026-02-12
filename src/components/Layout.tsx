import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "@/lib/auth";

type LayoutProps = {
  title?: string;
  children: ReactNode;
};

export default function Layout({ title, children }: LayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold text-slate-900">
            AirBridge Admin
          </Link>
          <div className="flex items-center gap-3">
            {title && <span className="text-sm text-slate-500">{title}</span>}
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
