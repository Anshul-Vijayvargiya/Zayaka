import React, { useState, useEffect } from "react";
import api, { errMsg } from "../../api/client";
import { Package, Plus, AlertTriangle, CheckCircle, Edit2, X, AlertCircle } from "lucide-react";

export default function InventoryManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: "", unit: "kg", quantity: 10, lowThreshold: 5 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/manage/inventory");
      setItems(res.data.items);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({ name: "", unit: "kg", quantity: 10, lowThreshold: 5 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      lowThreshold: item.lowThreshold,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        const res = await api.patch(`/manage/inventory/${editingItem._id}`, form);
        setItems((prev) => prev.map((i) => (i._id === editingItem._id ? res.data.item : i)));
      } else {
        const res = await api.post("/manage/inventory", form);
        setItems((prev) => [...prev, res.data.item]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const lowStockCount = items.filter((i) => i.quantity <= i.lowThreshold).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-paper-border">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-ink">
            Kitchen Raw Inventory
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Track stock levels, units, and threshold triggers for prep planning
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              {lowStockCount} Low Stock Item{lowStockCount > 1 ? "s" : ""}
            </span>
          )}

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-saffron hover:bg-saffron-hover text-white font-heading font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => {
          const isLow = item.quantity <= item.lowThreshold;
          return (
            <div
              key={item._id}
              className={`p-5 rounded-3xl border bg-paper-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                isLow ? "border-red-300 bg-red-50/30" : "border-paper-border"
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-paper-border">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-saffron" />
                    <h3 className="font-heading font-bold text-sm text-ink">{item.name}</h3>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1 text-ink-muted hover:text-saffron rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="my-4 text-center">
                  <span className={`font-heading font-extrabold text-3xl ${isLow ? "text-red-600" : "text-ink"}`}>
                    {item.quantity}
                  </span>
                  <span className="text-xs text-ink-muted font-semibold ml-1">{item.unit}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-ink-muted bg-paper p-2 rounded-xl border border-paper-border">
                  <span>Low Threshold:</span>
                  <span className="font-semibold text-ink">{item.lowThreshold} {item.unit}</span>
                </div>
              </div>

              <div className="mt-3 pt-2">
                {isLow ? (
                  <span className="w-full py-1.5 rounded-xl bg-red-100 text-red-700 text-[11px] font-bold flex items-center justify-center gap-1 border border-red-200">
                    <AlertTriangle className="w-3.5 h-3.5" /> LOW STOCK ALERT
                  </span>
                ) : (
                  <span className="w-full py-1.5 rounded-xl bg-leaf-light text-leaf text-[11px] font-semibold flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Sufficient Stock
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper-card rounded-3xl border border-paper-border max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-paper-border">
              <h2 className="font-heading font-bold text-lg text-ink">
                {editingItem ? "Edit Stock Item" : "Add Stock Item"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-ink-muted">
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
                  placeholder="e.g. Paneer"
                  className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="kg, l, g..."
                    className="w-full px-3 py-2 rounded-xl border border-paper-border text-ink bg-paper"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Low Stock Alert Threshold</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={form.lowThreshold}
                  onChange={(e) => setForm({ ...form, lowThreshold: Number(e.target.value) })}
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
                  {saving ? "Saving..." : "Save Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
