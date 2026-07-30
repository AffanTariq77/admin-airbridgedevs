import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "@/lib/auth";

type LayoutProps = {
  title?: string;
  children: ReactNode;
};

export default function Layout({ title, children }: LayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-semibold text-slate-900">
              AirBridge Admin
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                to="/"
                className="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100"
              >
                Dashboard
              </Link>
              <Link
                to="/attribution"
                className="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100"
              >
                Attribution
              </Link>
              <Link
                to="/form-submissions"
                className="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100"
              >
                Form Submissions
              </Link>
              <Link
                to="/contact-messages"
                className="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100"
              >
                Contact Messages
              </Link>
              <Link
                to="/blog"
                className="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100"
              >
                Blog
              </Link>
            </nav>
          </div>
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
