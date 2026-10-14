import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { getFormSubmissions } from "@/lib/supabaseClient";

const ALWAYS_LISTED_PLATFORMS = ["Food-Tech-Newsletter", "Food-Tech-QuoteRequest"];

export default function Dashboard() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  useEffect(() => {
    getFormSubmissions()
      .then(setSubmissions)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load submissions"))
      .finally(() => setLoading(false));
  }, []);

  // Get unique platforms. Listed ones show at 0 before their first submission,
  // so a newly launched site doesn't look disconnected.
  const platforms = Array.from(
    new Set([...ALWAYS_LISTED_PLATFORMS, ...submissions.map((sub) => sub.platform)])
  ).sort();

  // Filter submissions by selected platform
  const filteredSubmissions = selectedPlatform
    ? submissions.filter((sub) => sub.platform === selectedPlatform)
    : [];

  return (
    <Layout title="Dashboard">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-8 shadow-xl">
        {/* Remove gradient blobs */}
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Admin Control Center</p>
            <h1 className="mt-3 text-4xl font-extrabold text-headernav md:text-5xl drop-shadow-lg">
              Platforms
            </h1>
            <p className="mt-2 max-w-xl text-lg text-muted-foreground font-medium">
              Select a platform to view its form submissions.
            </p>
          </div>
        </div>
        {error && <div className="mt-6 text-red-500">{error}</div>}
        {loading ? (
          <div className="mt-6 text-muted-foreground">Loading platforms...</div>
        ) : (
          <div className="mt-8">
            {!selectedPlatform ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-border rounded-xl bg-white">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-6 py-4 text-left text-lg font-bold text-headernav border-b border-border">Platform</th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-headernav border-b border-border">Submissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platforms.map((platform) => (
                      <tr
                        key={platform}
                        className="hover:bg-cyan-50 cursor-pointer transition-all duration-150"
                        onClick={() => setSelectedPlatform(platform)}
                      >
                        <td className="px-6 py-4 font-semibold text-base text-headernav border-b border-border">
                          {platform}
                        </td>
                        <td className="px-6 py-4 text-base text-gray-700 border-b border-border">
                          {submissions.filter((sub) => sub.platform === platform).length} submissions
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <>
                <button className="mb-6 px-4 py-2 bg-primary text-black rounded-lg font-semibold shadow-md hover:scale-105 transition-all" onClick={() => setSelectedPlatform(null)}>
                  ← Back to Platforms
                </button>
                <div className="grid grid-cols-1 gap-6">
                  {filteredSubmissions.map((sub) => (
                    <div key={sub.id} className="bg-white rounded-2xl p-6 shadow-lg border border-border">
                      <div className="overflow-x-auto w-full max-w-full">
                        <table className="min-w-[700px] w-full border border-border rounded-xl">
                          <tbody>
                            <tr className="border-b border-border">
                              <td className="font-semibold text-base text-headernav pr-4 py-3 whitespace-nowrap align-top w-48">Full Name</td>
                              <td className="bg-white px-4 py-3 text-base font-bold text-gray-900 break-all whitespace-pre-wrap border-l border-border">{sub.full_name || ""}</td>
                            </tr>
                            <tr className="border-b border-border">
                              <td className="font-semibold text-base text-headernav pr-4 py-3 whitespace-nowrap align-top">Work Email</td>
                              <td className="bg-white px-4 py-3 text-base font-bold text-gray-900 break-all whitespace-pre-wrap border-l border-border">{sub.work_email || ""}</td>
                            </tr>
                            <tr className="border-b border-border">
                              <td className="font-semibold text-base text-headernav pr-4 py-3 whitespace-nowrap align-top">Company Name</td>
                              <td className="bg-white px-4 py-3 text-base font-bold text-gray-900 break-all whitespace-pre-wrap border-l border-border">{sub.company_name || ""}</td>
                            </tr>
                            <tr className="border-b border-border">
                              <td className="font-semibold text-base text-headernav pr-4 py-3 whitespace-nowrap align-top">Project Details</td>
                              <td className="bg-white px-4 py-3 text-base font-medium text-gray-900 border-l border-border">
                                <div className="max-h-24 overflow-y-auto whitespace-pre-line">{sub.project_details || ""}</div>
                              </td>
                            </tr>
                            <tr>
                              <td className="font-medium text-xs text-muted-foreground pr-4 py-2 whitespace-nowrap align-top">Submitted</td>
                              <td className="text-xs text-primary font-semibold px-4 py-2 border-l border-border break-all whitespace-pre-wrap">{new Date(sub.created_at).toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
