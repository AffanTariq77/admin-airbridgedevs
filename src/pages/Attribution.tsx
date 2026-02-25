import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { apiFetch } from "@/lib/api";
import type { Affiliate, AttributionSummary } from "@/types";

const emptyAffiliate: Partial<Affiliate> = {
  name: "",
  code: "",
  contactEmail: "",
  notes: "",
};

export default function Attribution() {
  const [summary, setSummary] = useState<AttributionSummary | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [form, setForm] = useState<Partial<Affiliate>>(emptyAffiliate);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      apiFetch<AttributionSummary>("/api/attribution/summary"),
      apiFetch<Affiliate[]>("/api/affiliates"),
    ])
      .then(([summaryData, affiliateData]) => {
        setSummary(summaryData);
        setAffiliates(affiliateData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreate = async () => {
    if (!form.name) {
      setError("Affiliate name is required");
      return;
    }
    try {
      const created = await apiFetch<Affiliate>("/api/affiliates", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setAffiliates((prev) => [created, ...prev]);
      setForm(emptyAffiliate);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create affiliate");
    }
  };

  const handleUpdate = async (id: number, payload: Partial<Affiliate>) => {
    try {
      const updated = await apiFetch<Affiliate>(`/api/affiliates/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setAffiliates((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update affiliate");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/api/affiliates/${id}`, { method: "DELETE" });
      setAffiliates((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete affiliate");
    }
  };

  const stats = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Attributed submissions", value: summary.total },
      { label: "Top sources", value: summary.bySource.length },
      { label: "Active affiliates", value: summary.byAffiliate.length },
    ];
  }, [summary]);

  return (
    <Layout title="Attribution">
      <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Attribution & Affiliates</h1>
        <p className="mt-2 text-sm text-slate-500">
          Track where customers come from, manage affiliate partners, and audit channel performance.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Top Sources</h2>
          <div className="mt-4 space-y-3">
            {summary?.bySource?.length ? (
              summary.bySource.map((item) => (
                <div key={item.key} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.key}</span>
                  <span className="font-semibold text-slate-900">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No attribution data yet.</p>
            )}
          </div>
          <h3 className="mt-6 text-sm font-semibold text-slate-900">Top Referrers</h3>
          <div className="mt-3 space-y-2">
            {summary?.topReferrers?.length ? (
              summary.topReferrers.map((item) => (
                <div key={item.key} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.key}</span>
                  <span className="font-semibold text-slate-900">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No referrer data yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Add affiliate</h2>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-4 grid gap-3">
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Affiliate name"
              value={form.name || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Affiliate code"
              value={form.code || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            />
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Contact email"
              value={form.contactEmail || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
            />
            <textarea
              className="min-h-[80px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Notes"
              value={form.notes || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
            <button
              className="rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white"
              onClick={handleCreate}
              disabled={loading}
            >
              Create affiliate
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Affiliate directory</h2>
        <div className="mt-4 space-y-4">
          {affiliates.length === 0 && !loading && (
            <p className="text-sm text-slate-500">No affiliates added yet.</p>
          )}
          {affiliates.map((affiliate) => (
            <div key={affiliate.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={affiliate.name}
                  onChange={(e) =>
                    setAffiliates((prev) =>
                      prev.map((item) =>
                        item.id === affiliate.id ? { ...item, name: e.target.value } : item
                      )
                    )
                  }
                  onBlur={(e) => handleUpdate(affiliate.id, { name: e.target.value })}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={affiliate.code || ""}
                  onChange={(e) =>
                    setAffiliates((prev) =>
                      prev.map((item) =>
                        item.id === affiliate.id ? { ...item, code: e.target.value } : item
                      )
                    )
                  }
                  onBlur={(e) => handleUpdate(affiliate.id, { code: e.target.value })}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={affiliate.contactEmail || ""}
                  onChange={(e) =>
                    setAffiliates((prev) =>
                      prev.map((item) =>
                        item.id === affiliate.id
                          ? { ...item, contactEmail: e.target.value }
                          : item
                      )
                    )
                  }
                  onBlur={(e) => handleUpdate(affiliate.id, { contactEmail: e.target.value })}
                />
                <button
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                  onClick={() => handleDelete(affiliate.id)}
                >
                  Delete
                </button>
              </div>
              <textarea
                className="mt-3 min-h-[70px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                value={affiliate.notes || ""}
                onChange={(e) =>
                  setAffiliates((prev) =>
                    prev.map((item) =>
                      item.id === affiliate.id ? { ...item, notes: e.target.value } : item
                    )
                  )
                }
                onBlur={(e) => handleUpdate(affiliate.id, { notes: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
