import { useEffect, useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { getFormSubmissions, subscribeToSubmissions, type FormSubmission } from "@/lib/supabaseClient";

export default function FormSubmissions() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  // Stats
  const stats = useMemo(() => {
    const platformCounts: Record<string, number> = {};
    submissions.forEach((sub) => {
      platformCounts[sub.platform] = (platformCounts[sub.platform] || 0) + 1;
    });
    return {
      total: submissions.length,
      platforms: Object.entries(platformCounts).map(([key, count]) => ({ key, count })),
    };
  }, [submissions]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesPlatform = platformFilter === "all" || sub.platform === platformFilter;
      const matchesSearch =
        search === "" ||
        sub.full_name.toLowerCase().includes(search.toLowerCase()) ||
        sub.work_email.toLowerCase().includes(search.toLowerCase()) ||
        (sub.company_name?.toLowerCase() || "").includes(search.toLowerCase());
      return matchesPlatform && matchesSearch;
    });
  }, [submissions, platformFilter, search]);

  // Get unique platforms
  const platforms = useMemo(() => {
    const unique = new Set(submissions.map((sub) => sub.platform));
    return ["all", ...Array.from(unique).sort()];
  }, [submissions]);

  useEffect(() => {
    // Load submissions
    getFormSubmissions()
      .then(setSubmissions)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load submissions"))
      .finally(() => setLoading(false));

    // Subscribe to real-time updates
    const unsubscribe = subscribeToSubmissions((newSubmission) => {
      setSubmissions((prev) => [newSubmission, ...prev]);
    });

    return unsubscribe;
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      "AI-Analytics-Dashboards": "bg-blue-100 text-blue-800",
      "AI-Integrations-Deployment": "bg-purple-100 text-purple-800",
      "AI-Powered-Automation": "bg-green-100 text-green-800",
      "AI-Strategy-Consulting": "bg-yellow-100 text-yellow-800",
      "airbridgedevs": "bg-indigo-100 text-indigo-800",
      "Custom-Software-Development": "bg-pink-100 text-pink-800",
      "Generative-AI-Solutions": "bg-orange-100 text-orange-800",
      "LLM-Cost-Optimization": "bg-red-100 text-red-800",
      "Low-Code-No-Code": "bg-teal-100 text-teal-800",
      "Food-Tech-Newsletter": "bg-lime-100 text-lime-800",
      "Food-Tech-QuoteRequest": "bg-lime-100 text-lime-800",
    };
    return colors[platform] || "bg-gray-100 text-gray-800";
  };

  return (
    <Layout title="Form Submissions">
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 shadow-lg">
          <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="absolute -left-10 -bottom-12 h-44 w-44 rounded-full bg-cyan-400/30 blur-3xl" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Supabase Integration</p>
            <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Form Submissions</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              All form submissions from your connected platforms in real-time.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">Total Submissions</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">Platforms</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.platforms.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">Today</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {
                submissions.filter(
                  (sub) =>
                    new Date(sub.created_at).toDateString() === new Date().toDateString()
                ).length
              }
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">This Week</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {
                submissions.filter((sub) => {
                  const submissionDate = new Date(sub.created_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return submissionDate >= weekAgo;
                }).length
              }
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-4">
              <input
                type="text"
                placeholder="Search by name, email, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {platforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform === "all" ? "All Platforms" : platform}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-slate-600">Loading submissions...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-slate-600">No submissions found.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Platform
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSubmissions.map((submission) => (
                    <tr
                      key={submission.id}
                      onClick={() => setSelectedSubmission(submission)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                        {formatDate(submission.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getPlatformColor(submission.platform)}`}
                        >
                          {submission.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {submission.full_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {submission.work_email}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {submission.company_name || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <h3 className="text-xl font-semibold text-slate-900">Submission Details</h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-6 p-6">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    Platform
                  </label>
                  <p className="mt-1">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getPlatformColor(selectedSubmission.platform)}`}
                    >
                      {selectedSubmission.platform}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    Submitted
                  </label>
                  <p className="mt-1 text-sm text-slate-900">
                    {formatDate(selectedSubmission.created_at)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    Full Name
                  </label>
                  <p className="mt-1 text-sm text-slate-900">{selectedSubmission.full_name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    Work Email
                  </label>
                  <p className="mt-1 text-sm text-slate-900">
                    <a
                      href={`mailto:${selectedSubmission.work_email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {selectedSubmission.work_email}
                    </a>
                  </p>
                </div>
                {selectedSubmission.company_name && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Company
                    </label>
                    <p className="mt-1 text-sm text-slate-900">{selectedSubmission.company_name}</p>
                  </div>
                )}
                {selectedSubmission.project_details && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Project Details
                    </label>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
                      {selectedSubmission.project_details}
                    </p>
                  </div>
                )}
                {selectedSubmission.additional_details && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Additional Details
                    </label>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
                      {selectedSubmission.additional_details}
                    </p>
                  </div>
                )}
                {selectedSubmission.llm_provider && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      LLM Provider
                    </label>
                    <p className="mt-1 text-sm text-slate-900">{selectedSubmission.llm_provider}</p>
                  </div>
                )}
                {selectedSubmission.monthly_spend && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Monthly Spend
                    </label>
                    <p className="mt-1 text-sm text-slate-900">{selectedSubmission.monthly_spend}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
