import React, { useState, useEffect } from "react";
import api, { errMsg } from "../../api/client";
import { Users, Plus, Shield, Mail, X, AlertCircle } from "lucide-react";

export default function StaffManager() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get("/manage/staff");
      setStaff(res.data.staff);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/manage/staff", { name, email, password, role });
      setStaff((prev) => [...prev, res.data.user]);
      setIsModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
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
            Staff & Kitchen Team Management
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Grant role-based access for floor staff waiters and kitchen chefs
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-saffron hover:bg-saffron-hover text-white font-heading font-bold text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Team Member</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {staff.map((user) => (
          <div
            key={user._id || user.id}
            className="p-5 rounded-3xl border border-paper-border bg-paper-card shadow-sm hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-saffron-pale text-saffron flex items-center justify-center font-heading font-bold text-base">
                {user.name.charAt(0)}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  user.role === "owner"
                    ? "bg-purple-100 text-purple-800"
                    : user.role === "kitchen"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {user.role}
              </span>
            </div>

            <div>
              <h3 className="font-heading font-bold text-sm text-ink">{user.name}</h3>
              <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper-card rounded-3xl border border-paper-border max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-paper-border">
              <h2 className="font-heading font-bold text-lg text-ink">Add Team Member</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-ink-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ravi Kumar"
                  className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@zayka.app"
                  className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper font-semibold"
                >
                  <option value="staff">Floor Staff / Waiter</option>
                  <option value="kitchen">Kitchen Staff / Chef</option>
                </select>
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
                  {saving ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
