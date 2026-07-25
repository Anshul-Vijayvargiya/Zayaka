import React, { useState, useEffect } from "react";
import api, { errMsg } from "../../api/client";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import VegBadge from "../../components/VegBadge";
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  AlertCircle,
  X,
} from "lucide-react";

export default function MenuManager() {
  const { user } = useAuth();
  const { socket, joinRooms } = useSocket();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "Starters",
    price: 199,
    isVeg: true,
    description: "",
    prepMinutes: 12,
    available: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMenu();
    if (user?.restaurantId) {
      joinRooms([`restaurant:${user.restaurantId}`]);
    }
  }, [user]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await api.get("/manage/menu");
      setItems(res.data.items);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const res = await api.patch(`/manage/menu/${item._id}`, {
        available: !item.available,
      });
      setItems((prev) =>
        prev.map((it) => (it._id === item._id ? res.data.item : it))
      );
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await api.delete(`/manage/menu/${id}`);
      setItems((prev) => prev.filter((it) => it._id !== id));
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      name: "",
      category: "Starters",
      price: 199,
      isVeg: true,
      description: "",
      prepMinutes: 12,
      available: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      price: item.price,
      isVeg: item.isVeg,
      description: item.description || "",
      prepMinutes: item.prepMinutes || 12,
      available: item.available,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        const res = await api.patch(`/manage/menu/${editingItem._id}`, form);
        setItems((prev) =>
          prev.map((it) => (it._id === editingItem._id ? res.data.item : it))
        );
      } else {
        const res = await api.post("/manage/menu", form);
        setItems((prev) => [...prev, res.data.item]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(
    (it) =>
      !search ||
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-paper-border">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-ink">
            Digital Menu & Live Item Stock 86
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Toggle availability to instantly update all open customer menus in real time
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items, categories..."
              className="pl-9 pr-4 py-1.5 rounded-xl border border-paper-border text-xs text-ink bg-paper-card focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-saffron hover:bg-saffron-hover text-white font-heading font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Menu Items Table */}
      <div className="bg-paper-card rounded-3xl border border-paper-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="bg-paper border-b border-paper-border text-ink-muted font-heading font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Prep Est.</th>
                <th className="px-6 py-4">Live Availability (86)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-border">
              {filteredItems.map((item) => (
                <tr key={item._id} className="hover:bg-paper/50 transition-colors">
                  <td className="px-6 py-4 font-semibold">
                    <div className="flex items-center gap-2">
                      <VegBadge isVeg={item.isVeg} />
                      <div>
                        <span>{item.name}</span>
                        {item.description && (
                          <p className="text-[11px] text-ink-muted font-normal line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-saffron-pale text-saffron font-semibold text-[11px]">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-heading font-bold text-sm">
                    ₹{item.price}
                  </td>
                  <td className="px-6 py-4 text-ink-muted">
                    {item.prepMinutes || 12} mins
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`px-3 py-1.5 rounded-xl font-heading font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                        item.available
                          ? "bg-leaf-light text-leaf border border-leaf/20 hover:bg-leaf hover:text-white"
                          : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white"
                      }`}
                    >
                      {item.available ? (
                        <>
                          <CheckCircle className="w-4 h-4" /> Available
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" /> 86'd (Out of Stock)
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-ink-muted hover:text-saffron rounded-lg hover:bg-paper transition-colors"
                        title="Edit Item"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 text-ink-muted hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper-card rounded-3xl border border-paper-border max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-paper-border">
              <h2 className="font-heading font-bold text-lg text-ink">
                {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-ink-muted hover:text-ink rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Malai Kofta"
                  className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper focus:outline-none focus:ring-2 focus:ring-saffron"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Starters, Mains..."
                    className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper focus:outline-none focus:ring-2 focus:ring-saffron"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper focus:outline-none focus:ring-2 focus:ring-saffron"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Type</label>
                  <select
                    value={form.isVeg ? "veg" : "nonveg"}
                    onChange={(e) => setForm({ ...form, isVeg: e.target.value === "veg" })}
                    className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper focus:outline-none focus:ring-2 focus:ring-saffron font-medium"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="nonveg">Non-Vegetarian</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.prepMinutes}
                    onChange={(e) => setForm({ ...form, prepMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper focus:outline-none focus:ring-2 focus:ring-saffron"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short appetizing description..."
                  className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper focus:outline-none focus:ring-2 focus:ring-saffron"
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
                  {saving ? "Saving..." : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
