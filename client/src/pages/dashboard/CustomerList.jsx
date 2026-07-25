import React, { useState, useEffect } from "react";
import api, { errMsg } from "../../api/client";
import { UserCheck, Calendar, DollarSign, Search, AlertCircle } from "lucide-react";

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/manage/customers");
      setCustomers(res.data.customers);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(
    (c) => !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-paper-border">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-ink">
            Customer Directory & Diner History
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Aggregated visit counts, total lifetime spend, and repeat guest analytics
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search diner name..."
            className="pl-9 pr-4 py-1.5 rounded-xl border border-paper-border text-xs text-ink bg-paper-card focus:outline-none focus:ring-2 focus:ring-saffron"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Customer Directory Table */}
      <div className="bg-paper-card rounded-3xl border border-paper-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="bg-paper border-b border-paper-border text-ink-muted font-heading font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Total Visits</th>
                <th className="px-6 py-4">Lifetime Spend</th>
                <th className="px-6 py-4">Last Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-border">
              {filtered.map((c, i) => (
                <tr key={i} className="hover:bg-paper/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-ink">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-saffron-pale text-saffron font-heading font-bold flex items-center justify-center text-xs">
                        {c.name ? c.name.charAt(0) : "G"}
                      </span>
                      <span>{c.name || "Guest Diner"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-paper border border-paper-border font-bold text-ink">
                      {c.visits} Visit{c.visits > 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-heading font-bold text-sm text-saffron">
                    ₹{Math.round(c.spent)}
                  </td>
                  <td className="px-6 py-4 text-ink-muted">
                    {c.lastVisit
                      ? new Date(c.lastVisit).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
