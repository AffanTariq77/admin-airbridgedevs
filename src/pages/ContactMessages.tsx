import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import {
  getContactMessages,
  subscribeToContactMessages,
  type ContactMessage,
} from "@/lib/supabaseClient";

export default function ContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  useEffect(() => {
    getContactMessages()
      .then(setMessages)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load messages"))
      .finally(() => setLoading(false));

    // New messages arrive without a reload, same as Form Submissions
    return subscribeToContactMessages((incoming) => {
      setMessages((prev) => [incoming, ...prev]);
    });
  }, []);

  const fullName = (message: ContactMessage) =>
    `${message.first_name || ""} ${message.last_name || ""}`.trim() || "—";

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return messages;

    return messages.filter((message) =>
      [fullName(message), message.email, message.subject, message.message]
        .some((field) => (field || "").toLowerCase().includes(term))
    );
  }, [messages, search]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return {
      total: messages.length,
      today: messages.filter((m) => new Date(m.created_at).toDateString() === today).length,
      week: messages.filter((m) => new Date(m.created_at) >= weekAgo).length,
    };
  }, [messages]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Layout title="Contact Messages">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 shadow-lg">
          <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="absolute -left-10 -bottom-12 h-44 w-44 rounded-full bg-cyan-400/30 blur-3xl" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Supabase Integration</p>
            <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Contact Messages</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Enquiries sent from the contact form and the CTA section on airbridgedevs.com.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">Total messages</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">Today</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.today}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">This week</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.week}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <input
            type="text"
            placeholder="Search by name, email, subject or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
            <p className="mt-4 text-sm text-slate-600">Loading messages...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-slate-600">
              {messages.length === 0 ? "No contact messages yet." : "No messages match that search."}
            </p>
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
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Subject
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((message) => (
                    <tr
                      key={message.id}
                      onClick={() => setSelected(message)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                        {formatDate(message.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {fullName(message)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{message.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{message.subject || "—"}</td>
                      <td className="max-w-xs truncate px-6 py-4 text-sm text-slate-600">
                        {message.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <h3 className="text-xl font-semibold text-slate-900">Message details</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="space-y-6 p-6">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    Received
                  </label>
                  <p className="mt-1 text-sm text-slate-900">{formatDate(selected.created_at)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    Name
                  </label>
                  <p className="mt-1 text-sm text-slate-900">{fullName(selected)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-slate-900">
                    <a
                      href={`mailto:${selected.email}?subject=${encodeURIComponent(
                        `Re: ${selected.subject || "Your enquiry"}`
                      )}`}
                      className="text-blue-600 hover:underline"
                    >
                      {selected.email}
                    </a>
                  </p>
                </div>
                {selected.subject && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Subject
                    </label>
                    <p className="mt-1 text-sm text-slate-900">{selected.subject}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    Message
                  </label>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
                    {selected.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
