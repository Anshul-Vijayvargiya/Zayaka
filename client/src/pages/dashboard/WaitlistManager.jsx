import React, { useState, useEffect } from "react";
import api, { errMsg } from "../../api/client";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { Users, Plus, Bell, CheckCircle2, Clock, X, AlertCircle } from "lucide-react";

export default function WaitlistManager() {
  const { user } = useAuth();
  const { socket, joinRooms } = useSocket();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWaitlist();
    if (user?.restaurantId) {
      joinRooms([`restaurant:${user.restaurantId}`]);
    }
  }, [user]);

  const fetchWaitlist = async () => {
    try {
      setLoading(true);
      const res = await api.get("/manage/waitlist");
      setEntries(res.data.entries);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleNew = (newEntry) => {
      setEntries((prev) => [...prev, newEntry]);
    };

    const handleUpdate = (updated) => {
      if (["seated", "left"].includes(updated.status)) {
        setEntries((prev) => prev.filter((e) => e._id !== updated._id));
      } else {
        setEntries((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      }
    };

    socket.on("waitlist:new", handleNew);
    socket.on("waitlist:update", handleUpdate);

    return () => {
      socket.off("waitlist:new", handleNew);
      socket.off("waitlist:update", handleUpdate);
    };
  }, [socket]);

  const updateStatus = async (id, status) => {
    try {
      const res = await api.patch(`/manage/waitlist/${id}`, { status });
      const updated = res.data.entry;
      if (["seated", "left"].includes(status)) {
        setEntries((prev) => prev.filter((e) => e._id !== id));
      } else {
        setEntries((prev) => prev.map((e) => (e._id === id ? updated : e)));
      }
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post(`/public/${user?.restaurantId}/waitlist`, {
        name,
        phone,
        partySize: Number(partySize),
      });
      setEntries((prev) => [...prev, res.data.entry]);
      setIsModalOpen(false);
      setName("");
      setPhone("");
      setPartySize(2);
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-paper-border">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-ink">
            Live Dining Waitlist Queue
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Manage waiting guests, notify when tables clear, and track party seating
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-saffron hover:bg-saffron-hover text-white font-heading font-bold text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Waiting Party</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Waitlist Queue Grid */}
      <div className="bg-paper-card rounded-3xl border border-paper-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="bg-paper border-b border-paper-border text-ink-muted font-heading font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Position</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Party Size</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-border">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-ink-muted italic">
                    No parties currently waiting on the queue.
                  </td>
                </tr>
              ) : (
                entries.map((entry, idx) => (
                  <tr key={entry._id} className="hover:bg-paper/50 transition-colors">
                    <td className="px-6 py-4 font-heading font-extrabold text-sm text-saffron">
                      #{idx + 1}
                    </td>
                    <td className="px-6 py-4 font-semibold text-ink">
                      {entry.name}
                    </td>
                    <td className="px-6 py-4 text-ink-muted font-mono">
                      {entry.phone}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {entry.partySize} Guests
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          entry.status === "notified"
                            ? "bg-amber-100 text-amber-800 animate-pulse"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {entry.status === "waiting" && (
                          <button
                            onClick={() => updateStatus(entry._id, "notified")}
                            className="px-3 py-1.5 rounded-xl bg-saffron text-white font-heading font-semibold text-[11px] shadow-sm flex items-center gap-1"
                          >
                            <Bell className="w-3.5 h-3.5" /> Notify Table Ready
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(entry._id, "seated")}
                          className="px-3 py-1.5 rounded-xl bg-leaf text-white font-heading font-semibold text-[11px] shadow-sm flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Seated
                        </button>
                        <button
                          onClick={() => updateStatus(entry._id, "left")}
                          className="px-2.5 py-1.5 rounded-xl bg-paper text-ink-muted hover:text-red-600 font-semibold text-[11px] border border-paper-border"
                        >
                          Left
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper-card rounded-3xl border border-paper-border max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-paper-border">
              <h2 className="font-heading font-bold text-lg text-ink">Add Waiting Guest</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-ink-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Guest Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Party Size</label>
                <input
                  type="number"
                  min={1}
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-paper-border text-ink font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-saffron text-white font-heading font-semibold shadow-md"
                >
                  {saving ? "Saving..." : "Add to Queue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
