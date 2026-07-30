import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-violet-500/30 blur-3xl" />
      <div className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-cyan-400/30 blur-3xl" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">AirBridge Admin</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-300">
            Sign in to manage repositories and submissions.
          </p>
        </div>
        {error && (
          <p className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
              Email
            </label>
            <input
              className="mt-2 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
              Password
            </label>
            <input
              className="mt-2 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button
            className="w-full rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:brightness-110 disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
