import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api, { errMsg } from "../api/client";
import { useSocket } from "../context/SocketContext";
import { Users, Clock, CheckCircle2, Phone, User, AlertCircle, ArrowLeft } from "lucide-react";

export default function CustomerWaitlist() {
  const { slug } = useParams();
  const { socket, joinRooms } = useSocket();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(2);

  const [entry, setEntry] = useState(null);
  const [position, setPosition] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post(`/public/${slug}/waitlist`, {
        name,
        phone,
        partySize: Number(partySize),
      });

      const newEntry = res.data.entry;
      setEntry(newEntry);
      joinRooms([`waitlist:${newEntry._id}`]);
      fetchStatus(newEntry._id);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async (id) => {
    try {
      const res = await api.get(`/public/${slug}/waitlist/${id}`);
      setEntry(res.data.entry);
      setPosition(res.data.position);
    } catch (err) {
      console.error(err);
    }
  };

  // Socket updates for waitlist
  useEffect(() => {
    if (!socket || !entry?._id) return;

    const handleWaitlistUpdate = (updated) => {
      if (updated._id === entry._id) {
        setEntry(updated);
        fetchStatus(updated._id);
      }
    };

    socket.on("waitlist:update", handleWaitlistUpdate);
    return () => {
      socket.off("waitlist:update", handleWaitlistUpdate);
    };
  }, [socket, entry]);

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-paper-card p-6 rounded-3xl border border-paper-border shadow-xl">
        <Link
          to={`/r/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-saffron mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </Link>

        {!entry ? (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-saffron-pale text-saffron flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="font-heading font-extrabold text-2xl text-ink">
                Join Restaurant Waitlist
              </h1>
              <p className="text-xs text-ink-muted mt-1">
                Get notified live on your phone when your table is ready
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Diya Sharma"
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-paper-border text-xs text-ink bg-paper focus:outline-none focus:ring-2 focus:ring-saffron"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-paper-border text-xs text-ink bg-paper focus:outline-none focus:ring-2 focus:ring-saffron"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Party Size (Guests)
                </label>
                <select
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-paper-border text-xs text-ink bg-paper focus:outline-none focus:ring-2 focus:ring-saffron font-semibold"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((num) => (
                    <option key={num} value={num}>
                      {num} Guest{num > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-saffron hover:bg-saffron-hover text-white font-heading font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Joining Queue..." : "Join Live Waitlist"}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-saffron-pale text-saffron flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Current Queue Position
              </span>
              <h2 className="font-heading font-extrabold text-5xl text-saffron mt-1">
                #{position > 0 ? position : "1"}
              </h2>
              <p className="text-xs text-ink-muted mt-2">
                {position > 1
                  ? `${position - 1} party ahead of you`
                  : "You're next in line!"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-paper border border-paper-border text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">Guest Name:</span>
                <span className="font-semibold text-ink">{entry.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">Party Size:</span>
                <span className="font-semibold text-ink">{entry.partySize} People</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">Status:</span>
                <span className="font-bold text-saffron uppercase tracking-wider">
                  {entry.status}
                </span>
              </div>
            </div>

            {entry.status === "notified" && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Your table is ready! Please report to the host host counter.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
