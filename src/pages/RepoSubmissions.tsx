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
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [affiliateFilter, setAffiliateFilter] = useState("all");
  const [search, setSearch] = useState("");

  const title = useMemo(() => (repo?.name ? `Repo: ${repo.name}` : "Repository"), [repo]);
  const stats = useMemo(() => {
    const base = {
      total: 0,
      new: 0,
      in_review: 0,
      resolved: 0,
      archived: 0,
    };
    return submissions.reduce((acc, item) => {
      acc.total += 1;
      const key = (item.status || "new") as keyof typeof base;
      if (key in acc) {
        acc[key] += 1;
      }
      return acc;
    }, base);
  }, [submissions]);

  const statusBadge: Record<string, string> = {
    new: "bg-blue-50 text-blue-600",
    in_review: "bg-amber-50 text-amber-600",
    resolved: "bg-emerald-50 text-emerald-600",
    archived: "bg-slate-100 text-slate-600",
  };

  const sources = useMemo(() => {
    const unique = new Set(submissions.map((item) => item.source).filter(Boolean));
    return ["all", ...Array.from(unique)] as string[];
  }, [submissions]);

  const affiliates = useMemo(() => {
    const unique = new Set(submissions.map((item) => item.affiliateName).filter(Boolean));
    return ["all", ...Array.from(unique)] as string[];
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      const matchesStatus = statusFilter === "all" || (item.status || "new") === statusFilter;
      const matchesSource = sourceFilter === "all" || (item.source || "") === sourceFilter;
      const matchesAffiliate =
        affiliateFilter === "all" || (item.affiliateName || "") === affiliateFilter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        (item.company || "").toLowerCase().includes(query);
      return matchesStatus && matchesSource && matchesAffiliate && matchesSearch;
    });
  }, [submissions, statusFilter, sourceFilter, affiliateFilter, search]);

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

  const updateAttribution = async (id: number, payload: Partial<Submission>) => {
    if (!repoId) return;
    try {
      await apiFetch(`/api/repos/${repoId}/submissions/${id}/attribution`, {
        method: "PATCH",
        body: JSON.stringify({
          source: payload.source,
          medium: payload.medium,
          campaign: payload.campaign,
          term: payload.term,
          content: payload.content,
          referrer: payload.referrer,
          landingPage: payload.landingPage,
          affiliateId: payload.affiliateId,
          affiliateName: payload.affiliateName,
          channel: payload.channel,
        }),
      });
      setSubmissions((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...payload } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update attribution");
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
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
              ← Back to dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Submissions</h1>
            <p className="mt-1 text-sm text-slate-500">
              Review, update status, and keep every request on track.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-3 md:w-auto">
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
              <p className="text-xs text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
              <p className="text-xs text-slate-500">New</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.new}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
              <p className="text-xs text-slate-500">Resolved</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-4 grid gap-3 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm lg:grid-cols-[1.2fr_repeat(3,0.8fr)]">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Search by name, email, or company"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All status</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ")}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            {sources.map((source) => (
              <option key={source} value={source}>
                {source === "all" ? "All sources" : source}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            value={affiliateFilter}
            onChange={(e) => setAffiliateFilter(e.target.value)}
          >
            {affiliates.map((affiliate) => (
              <option key={affiliate} value={affiliate}>
                {affiliate === "all" ? "All affiliates" : affiliate}
              </option>
            ))}
          </select>
        </div>

        {loading && <div className="text-slate-500">Loading submissions...</div>}
        {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {!loading && !error && (
          <div className="space-y-5">
            {filteredSubmissions.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
                No submissions found.
              </div>
            )}
            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="group rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-slate-400">#{submission.id}</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[submission.status || "new"]}`}
                      >
                        {(submission.status || "new").replace("_", " ")}
                      </span>
                      {submission.source && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {submission.source}
                        </span>
                      )}
                      {submission.affiliateName && (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-600">
                          {submission.affiliateName}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900">{submission.name}</h2>
                    <p className="text-sm text-slate-600">{submission.email}</p>
                    {submission.company && (
                      <p className="text-sm text-slate-600">{submission.company}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      {new Date(submission.timestamp).toLocaleString()}
                    </p>
                    {submission.llmProvider && (
                      <p className="text-xs text-slate-500">LLM Provider: {submission.llmProvider}</p>
                    )}
                    {submission.monthlySpend && (
                      <p className="text-xs text-slate-500">Monthly Spend: {submission.monthlySpend}</p>
                    )}
                    {submission.ip && (
                      <p className="text-xs text-slate-500">IP: {submission.ip}</p>
                    )}
                    {submission.userAgent && (
                      <p className="text-xs text-slate-500">UA: {submission.userAgent}</p>
                    )}
                  </div>
                  <div className="grid w-full gap-4 xl:grid-cols-2">
                    <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Status
                      </label>
                      <select
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        value={submission.status || "new"}
                        onChange={(e) =>
                          updateSubmission(submission.id, e.target.value, submission.notes || "")
                        }
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                      <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Notes
                      </label>
                      <textarea
                        className="mt-2 min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
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
                        className="mt-4 w-full rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                        onClick={() => deleteSubmission(submission.id)}
                      >
                        Delete submission
                      </button>
                    </div>
                    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Attribution
                      </p>
                      <div className="mt-3 grid gap-3">
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          placeholder="Source (utm_source)"
                          value={submission.source || ""}
                          onChange={(e) =>
                            setSubmissions((prev) =>
                              prev.map((item) =>
                                item.id === submission.id
                                  ? { ...item, source: e.target.value }
                                  : item
                              )
                            )
                          }
                          onBlur={(e) => updateAttribution(submission.id, { source: e.target.value })}
                        />
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          placeholder="Medium (utm_medium)"
                          value={submission.medium || ""}
                          onChange={(e) =>
                            setSubmissions((prev) =>
                              prev.map((item) =>
                                item.id === submission.id
                                  ? { ...item, medium: e.target.value }
                                  : item
                              )
                            )
                          }
                          onBlur={(e) => updateAttribution(submission.id, { medium: e.target.value })}
                        />
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          placeholder="Campaign (utm_campaign)"
                          value={submission.campaign || ""}
                          onChange={(e) =>
                            setSubmissions((prev) =>
                              prev.map((item) =>
                                item.id === submission.id
                                  ? { ...item, campaign: e.target.value }
                                  : item
                              )
                            )
                          }
                          onBlur={(e) => updateAttribution(submission.id, { campaign: e.target.value })}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            placeholder="Term (utm_term)"
                            value={submission.term || ""}
                            onChange={(e) =>
                              setSubmissions((prev) =>
                                prev.map((item) =>
                                  item.id === submission.id ? { ...item, term: e.target.value } : item
                                )
                              )
                            }
                            onBlur={(e) => updateAttribution(submission.id, { term: e.target.value })}
                          />
                          <input
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            placeholder="Content (utm_content)"
                            value={submission.content || ""}
                            onChange={(e) =>
                              setSubmissions((prev) =>
                                prev.map((item) =>
                                  item.id === submission.id
                                    ? { ...item, content: e.target.value }
                                    : item
                                )
                              )
                            }
                            onBlur={(e) =>
                              updateAttribution(submission.id, { content: e.target.value })
                            }
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            placeholder="Affiliate"
                            value={submission.affiliateName || ""}
                            onChange={(e) =>
                              setSubmissions((prev) =>
                                prev.map((item) =>
                                  item.id === submission.id
                                    ? { ...item, affiliateName: e.target.value }
                                    : item
                                )
                              )
                            }
                            onBlur={(e) =>
                              updateAttribution(submission.id, { affiliateName: e.target.value })
                            }
                          />
                          <input
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            placeholder="Channel"
                            value={submission.channel || ""}
                            onChange={(e) =>
                              setSubmissions((prev) =>
                                prev.map((item) =>
                                  item.id === submission.id
                                    ? { ...item, channel: e.target.value }
                                    : item
                                )
                              )
                            }
                            onBlur={(e) => updateAttribution(submission.id, { channel: e.target.value })}
                          />
                        </div>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          placeholder="Referrer"
                          value={submission.referrer || ""}
                          onChange={(e) =>
                            setSubmissions((prev) =>
                              prev.map((item) =>
                                item.id === submission.id
                                  ? { ...item, referrer: e.target.value }
                                  : item
                              )
                            )
                          }
                          onBlur={(e) => updateAttribution(submission.id, { referrer: e.target.value })}
                        />
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          placeholder="Landing page"
                          value={submission.landingPage || ""}
                          onChange={(e) =>
                            setSubmissions((prev) =>
                              prev.map((item) =>
                                item.id === submission.id
                                  ? { ...item, landingPage: e.target.value }
                                  : item
                              )
                            )
                          }
                          onBlur={(e) => updateAttribution(submission.id, { landingPage: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
                  {submission.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
