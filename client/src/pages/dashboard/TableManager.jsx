import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import api, { errMsg } from "../../api/client";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { QrCode, Plus, Users, Printer, X, AlertCircle, Copy, Check } from "lucide-react";

function CopyLinkRow({ url, className = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard permission denied/unavailable — the URL is still visible to copy by hand
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`} onClick={(e) => e.stopPropagation()}>
      <span className="flex-1 min-w-0 truncate font-mono text-[10px] text-ink-muted bg-paper border border-paper-border rounded-lg px-2 py-1.5">
        {url}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex-shrink-0 print:hidden flex items-center gap-1 text-[10px] font-semibold text-saffron border border-saffron/30 bg-saffron-pale hover:bg-saffron hover:text-white rounded-lg px-2.5 py-1.5 transition-colors"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        <span>{copied ? "Copied!" : "Copy link"}</span>
      </button>
    </div>
  );
}

export default function TableManager() {
  const { user } = useAuth();
  const { socket, joinRooms } = useSocket();

  const [restaurant, setRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTable, setSelectedTable] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchData();
    if (user?.restaurantId) {
      joinRooms([`restaurant:${user.restaurantId}`]);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [restRes, tableRes] = await Promise.all([
        api.get("/manage/restaurant"),
        api.get("/manage/tables"),
      ]);
      setRestaurant(restRes.data.restaurant);
      setTables(tableRes.data.tables);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleTableUpdate = (updatedTable) => {
      setTables((prev) =>
        prev.map((t) => (t._id === updatedTable._id ? updatedTable : t))
      );
    };

    socket.on("table:update", handleTableUpdate);
    return () => {
      socket.off("table:update", handleTableUpdate);
    };
  }, [socket]);

  const handleAddTable = async () => {
    try {
      setAdding(true);
      const res = await api.post("/manage/tables", { capacity: 4 });
      setTables((prev) => [...prev, res.data.table]);
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setAdding(false);
    }
  };

  const setTableStatus = async (tableId, status) => {
    try {
      const res = await api.patch(`/manage/tables/${tableId}`, { status });
      setTables((prev) =>
        prev.map((t) => (t._id === tableId ? res.data.table : t))
      );
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const getCustomerUrl = (tableNum) => {
    const origin = window.location.origin;
    const slug = restaurant?.slug || "zayka-demo";
    return `${origin}/r/${slug}?table=${tableNum}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-paper-border">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-ink">
            Tables & Printable Per-Table QR Codes
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Generate QR standees for every table. Scanning routes diners directly to their table cart.
          </p>
        </div>

        <button
          onClick={handleAddTable}
          disabled={adding}
          className="px-4 py-2 rounded-xl bg-saffron hover:bg-saffron-hover text-white font-heading font-bold text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{adding ? "Adding Table..." : "Add New Table"}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map((table) => {
          const qrUrl = getCustomerUrl(table.number);
          const isOccupied = table.status === "occupied";
          const isBilling = table.status === "billing";

          return (
            <div
              key={table._id}
              className={`p-5 rounded-3xl border bg-paper-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                isOccupied
                  ? "border-amber-300 bg-amber-50/30"
                  : isBilling
                  ? "border-purple-300 bg-purple-50/30"
                  : "border-paper-border"
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-paper-border">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-saffron text-white flex items-center justify-center font-heading font-bold text-sm shadow-sm">
                      {table.number}
                    </span>
                    <span className="font-heading font-bold text-sm text-ink">
                      Table #{table.number}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isOccupied
                        ? "bg-amber-100 text-amber-800"
                        : isBilling
                        ? "bg-purple-100 text-purple-800"
                        : "bg-leaf-light text-leaf"
                    }`}
                  >
                    {table.status}
                  </span>
                </div>

                <div className="my-3 flex items-center justify-between text-xs text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Capacity: {table.capacity} Guests
                  </span>
                </div>

                {/* QR Thumbnail */}
                <div
                  onClick={() => setSelectedTable(table)}
                  className="my-3 p-3 bg-white rounded-2xl border border-paper-border flex flex-col items-center justify-center cursor-pointer hover:border-saffron group transition-colors"
                >
                  <QRCodeSVG value={qrUrl} size={100} />
                  <span className="text-[10px] font-semibold text-saffron group-hover:underline mt-2 flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> Click to Print Standee
                  </span>
                </div>

                <CopyLinkRow url={qrUrl} />
              </div>

              {/* Status Controls */}
              <div className="pt-2 border-t border-paper-border flex items-center gap-2 text-xs">
                {table.status !== "free" && (
                  <button
                    onClick={() => setTableStatus(table._id, "free")}
                    className="flex-1 py-1.5 rounded-xl bg-leaf text-white font-semibold text-[11px] shadow-sm"
                  >
                    Mark Free
                  </button>
                )}
                {table.status === "free" && (
                  <button
                    onClick={() => setTableStatus(table._id, "occupied")}
                    className="flex-1 py-1.5 rounded-xl bg-amber-600 text-white font-semibold text-[11px] shadow-sm"
                  >
                    Mark Occupied
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Printable QR Code Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl border border-paper-border print:border-none print:shadow-none">
            <div className="flex justify-end print:hidden">
              <button
                onClick={() => setSelectedTable(null)}
                className="p-1 rounded-full text-ink-muted hover:bg-paper"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-saffron text-white flex items-center justify-center font-heading font-bold text-xl mx-auto shadow-md">
                Z
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-ink">
                {restaurant?.name}
              </h2>
              <p className="text-xs text-saffron font-bold uppercase tracking-widest font-heading">
                TABLE #{selectedTable.number} STANDEE
              </p>
            </div>

            <div className="p-6 bg-paper rounded-3xl border border-paper-border inline-block shadow-inner">
              <QRCodeSVG value={getCustomerUrl(selectedTable.number)} size={180} />
            </div>

            <p className="text-xs text-ink-muted leading-relaxed font-medium">
              Scan this QR code with your smartphone camera to browse our menu and place your order.
            </p>

            <CopyLinkRow url={getCustomerUrl(selectedTable.number)} />

            <div className="print:hidden pt-2">
              <button
                onClick={handlePrint}
                className="w-full py-3 rounded-2xl bg-ink hover:bg-ink-light text-white font-heading font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-saffron" />
                <span>Print Table Standee</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
