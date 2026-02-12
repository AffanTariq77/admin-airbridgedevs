import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { apiFetch } from "@/lib/api";
import type { Repo, Submission } from "@/types";

const statusOptions = ["new", "in_review", "resolved", "archived"];

export default function RepoSubmissions() {
  const { repoId } = useParams();
  const [repo, setRepo] = useState<Repo | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (repo?.name ? `Repo: ${repo.name}` : "Repository"), [repo]);

  useEffect(() => {
    if (!repoId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch<Repo[]>("/api/repos"),
      apiFetch<Submission[]>(`/api/repos/${repoId}/submissions`),
    ])
      .then(([repos, items]) => {
        setRepo(repos.find((r) => r.id === repoId) || null);
        setSubmissions(items);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [repoId]);

  const updateSubmission = async (id: number, status: string, notes: string) => {
    if (!repoId) return;
    try {
      await apiFetch(`/api/repos/${repoId}/submissions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes }),
      });
      setSubmissions((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status, notes } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const deleteSubmission = async (id: number) => {
    if (!repoId) return;
    try {
      await apiFetch(`/api/repos/${repoId}/submissions/${id}`, {
        method: "DELETE",
      });
      setSubmissions((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <Layout title={title}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 mt-2">Submissions</h1>
        </div>
      </div>

      {loading && <div className="text-slate-500">Loading submissions...</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}

      {!loading && !error && (
        <div className="space-y-4">
          {submissions.length === 0 && (
            <div className="text-slate-500">No submissions found.</div>
          )}
          {submissions.map((submission) => (
            <div key={submission.id} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">#{submission.id}</p>
                  <h2 className="text-lg font-semibold text-slate-900">{submission.name}</h2>
                  <p className="text-sm text-slate-600">{submission.email}</p>
                  {submission.company && <p className="text-sm text-slate-600">{submission.company}</p>}
                  <p className="text-sm text-slate-500 mt-2">{new Date(submission.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-2 min-w-[220px]">
                  <label className="text-xs text-slate-500">Status</label>
                  <select
                    className="border border-slate-300 rounded px-2 py-1"
                    value={submission.status || "new"}
                    onChange={(e) =>
                      updateSubmission(submission.id, e.target.value, submission.notes || "")
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <label className="text-xs text-slate-500">Notes</label>
                  <textarea
                    className="border border-slate-300 rounded px-2 py-1 min-h-[60px]"
                    value={submission.notes || ""}
                    onChange={(e) =>
                      setSubmissions((prev) =>
                        prev.map((item) =>
                          item.id === submission.id ? { ...item, notes: e.target.value } : item
                        )
                      )
                    }
                    onBlur={(e) =>
                      updateSubmission(submission.id, submission.status || "new", e.target.value)
                    }
                  />
                  <button
                    className="text-sm text-red-600 hover:text-red-700 mt-2"
                    onClick={() => deleteSubmission(submission.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-700 whitespace-pre-wrap">{submission.message}</div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
