import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { apiFetch } from "@/lib/api";
import type { Repo } from "@/types";

export default function Dashboard() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Repo[]>("/api/repos")
      .then(setRepos)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Dashboard">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Connected Repositories</h1>
          <p className="text-sm text-slate-500">Overview of submissions across all projects.</p>
        </div>
      </div>

      {loading && <div className="text-slate-500">Loading repositories...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2">
          {repos.map((repo) => (
            <Link
              key={repo.id}
              to={`/repos/${repo.id}`}
              className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-sm transition"
            >
              <h2 className="text-lg font-semibold text-slate-900">{repo.name}</h2>
              {repo.description && (
                <p className="text-sm text-slate-500 mt-1">{repo.description}</p>
              )}
              <p className="text-sm text-slate-700 mt-3">
                Submissions: <span className="font-semibold">{repo.submissionCount ?? 0}</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
