"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MobileMenuButton from "@/components/MobileMenuButton";

interface Product {
  id: string;
  name: string;
  brand_id: string | null;
  is_serialized: boolean;
  cost_price: number;
}

interface Brand {
  id: string;
  name: string;
}

interface SaleInfo {
  id: string;
  selling_price: number;
  profit: number;
  sold_at: string;
}

interface StockItem {
  id: string;
  imei: string;
  variant: string | null;
  cost_price: number;
  status: string;
  condition_notes: string | null;
  purchased_at: string;
  sold_at: string | null;
  sale_id: string | null;
  sale: SaleInfo | null;
}

interface Stats {
  totalRegistered: number;
  inStock: number;
  sold: number;
  faulty: number;
}

interface Profile {
  role: string;
  store_name: string;
  full_name: string;
}

interface Props {
  products: Product[];
  brands: Brand[];
  selectedProduct: Product | null;
  stockItems: StockItem[];
  stats: Stats;
  profile: Profile;
  initialProductId: string | null;
}

export default function IMEIClient({
  products,
  brands,
  selectedProduct,
  stockItems,
  stats,
  profile,
  initialProductId,
}: Props) {
  const router = useRouter();
  const isOwner = profile.role === "owner";

  const [imeiSearch, setImeiSearch] = useState("");
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<
    StockItem | null | "not_found"
  >(null);

  const [form, setForm] = useState({
  purchasedAt: new Date().toISOString().split("T")[0],
});

const [unitRows, setUnitRows] = useState([
  { imei: "", variant: "", costPrice: selectedProduct ? String(selectedProduct.cost_price) : "" }
]);

function addRow() {
  setUnitRows([...unitRows, { imei: "", variant: "", costPrice: selectedProduct ? String(selectedProduct.cost_price) : "" }]);
}

function removeRow(index: number) {
  if (unitRows.length === 1) return;
  setUnitRows(unitRows.filter((_, i) => i !== index));
}

function updateRow(index: number, field: string, value: string) {
  setUnitRows(unitRows.map((row, i) => i === index ? { ...row, [field]: value } : row));
}

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

  function getStatusStyle(status: string) {
    switch (status) {
      case "in_stock":
        return { bg: "#DCFCE7", color: "#14532D", label: "In stock" };
      case "sold":
        return { bg: "#E1F5EE", color: "#0F6E56", label: "Sold" };
      case "faulty":
        return { bg: "#FEE2E2", color: "#7F1D1D", label: "Faulty" };
      case "returned":
        return { bg: "#FFF7ED", color: "#9A3412", label: "Returned" };
      default:
        return { bg: "#F3F4F6", color: "#6B7280", label: status };
    }
  }

  function handleSearch() {
    if (!imeiSearch.trim()) return;
    const found = stockItems.find(
      (item) => item.imei.toLowerCase() === imeiSearch.trim().toLowerCase(),
    );
    setSearchResult(found ?? "not_found");
  }
async function handleAddUnit() {
  if (!selectedProduct) return;

  // Validate all rows
  const validRows = unitRows.filter((r) => r.imei.trim().length >= 10);
  if (validRows.length === 0) {
    setError("Add at least one valid IMEI (minimum 10 digits).");
    return;
  }

  const invalidRows = unitRows.filter((r) => r.imei.trim() && r.imei.trim().length < 10);
  if (invalidRows.length > 0) {
    setError(`Some IMEIs are too short. Each IMEI must be at least 10 digits.`);
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const inserts = validRows.map((r) => ({
      product_id: selectedProduct.id,
      imei: r.imei.trim(),
      variant: r.variant.trim() || null,
      cost_price: Number(r.costPrice) || Number(selectedProduct.cost_price),
      status: "in_stock",
      purchased_at: new Date(form.purchasedAt).toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("stock_items")
      .insert(inserts);

    if (insertError) {
      if (insertError.message.includes("unique")) {
        setError("One or more IMEIs are already registered in the system.");
      } else {
        throw insertError;
      }
      return;
    }

    setUnitRows([{ imei: "", variant: "", costPrice: String(selectedProduct.cost_price) }]);
    setShowAddUnit(false);
    router.refresh();
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : "Something went wrong.");
  } finally {
    setLoading(false);
  }
}

  return (
    <div>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <div>
          <h1 className="text-lg font-bold text-gray-900">IMEI Tracker</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Serialized units — {profile.store_name}
          </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/inventory")}
            className="h-9 px-4 rounded-xl border text-sm font-medium"
            style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
          >
            ← Inventory
          </button>
          {isOwner && selectedProduct && (
            <button
              onClick={() => setShowAddUnit(true)}
              className="h-9 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
              style={{ backgroundColor: "#0D3B2E" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              Register unit
            </button>
          )}
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-5">
        {/* Product selector */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Select product
          </label>
          <select
            value={initialProductId ?? ""}
            onChange={(e) => router.push(`/imei?product=${e.target.value}`)}
            className="w-full h-11 px-3 rounded-xl border text-sm outline-none bg-white"
            style={{ borderColor: "#E5E7EB" }}
          >
            <option value="">— Choose a serialized product —</option>
            {products.map((p) => {
              const brand = brands.find((b) => b.id === p.brand_id);
              const brandPrefix =
                brand &&
                !p.name.toLowerCase().startsWith(brand.name.toLowerCase())
                  ? `${brand.name} `
                  : "";
              return (
                <option key={p.id} value={p.id}>
                  {brandPrefix}
                  {p.name}
                </option>
              );
            })}
          </select>
        </div>

        {selectedProduct && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  label: "Total registered",
                  value: stats.totalRegistered,
                  color: "#1D9E75",
                },
                { label: "In stock", value: stats.inStock, color: "#16A34A" },
                {
                  label: "Sold this month",
                  value: stats.sold,
                  color: "#0F6E56",
                },
                {
                  label: "Faulty / returned",
                  value: stats.faulty,
                  color: "#DC2626",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-2xl border border-gray-100 p-4"
                  style={{ borderLeft: `4px solid ${stat.color}` }}
                >
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color:
                        stat.color === "#DC2626" && stat.value > 0
                          ? stat.color
                          : "#111827",
                    }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* IMEI Search */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-semibold text-gray-900 mb-3">
                Search by IMEI
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imeiSearch}
                  onChange={(e) => {
                    setImeiSearch(e.target.value);
                    setSearchResult(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Enter IMEI number..."
                  className="flex-1 h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#E5E7EB" }}
                />
                <button
                  onClick={handleSearch}
                  className="h-11 px-5 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: "#0D3B2E" }}
                >
                  Search
                </button>
              </div>

              {/* Search result */}
              {searchResult === "not_found" && (
                <div
                  className="mt-3 p-3 rounded-xl text-sm"
                  style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                >
                  No unit found with IMEI {imeiSearch}
                </div>
              )}

              {searchResult && searchResult !== "not_found" && (
                <div
                  className="mt-3 p-4 rounded-xl"
                  style={{
                    backgroundColor: "#E1F5EE",
                    border: "1px solid #5DCAA5",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-sm font-bold"
                      style={{ color: "#0D3B2E" }}
                    >
                      Unit found — {selectedProduct.name}
                    </span>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: getStatusStyle(searchResult.status).bg,
                        color: getStatusStyle(searchResult.status).color,
                      }}
                    >
                      {getStatusStyle(searchResult.status).label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { label: "IMEI", value: searchResult.imei },
                      { label: "Variant", value: searchResult.variant ?? "—" },
                      {
                        label: "Purchased",
                        value: new Date(
                          searchResult.purchased_at,
                        ).toLocaleDateString("en-NG"),
                      },
                      {
                        label: "Cost price",
                        value: fmt(Number(searchResult.cost_price)),
                      },
                      {
                        label: "Sold for",
                        value: searchResult.sale
                          ? fmt(Number(searchResult.sale.selling_price))
                          : "—",
                      },
                      {
                        label: "Profit",
                        value: searchResult.sale
                          ? fmt(Number(searchResult.sale.profit))
                          : "—",
                      },
                    ].map((field) => (
                      <div key={field.label}>
                        <p
                          className="text-xs font-semibold mb-1"
                          style={{ color: "#0F6E56" }}
                        >
                          {field.label}
                        </p>
                        <p
                          className="text-sm font-bold"
                          style={{ color: "#0D3B2E" }}
                        >
                          {field.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  {searchResult.condition_notes && (
                    <div
                      className="mt-3 p-2.5 rounded-lg"
                      style={{ backgroundColor: "#FFF7ED" }}
                    >
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "#9A3412" }}
                      >
                        Condition note
                      </p>
                      <p
                        className="text-sm mt-0.5"
                        style={{ color: "#9A3412" }}
                      >
                        {searchResult.condition_notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Units table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">
                  {selectedProduct.name} — all registered units
                </p>
                {isOwner && (
                  <button
                    onClick={() => setShowAddUnit(true)}
                    className="text-sm font-medium"
                    style={{ color: "#1D9E75" }}
                  >
                    + Register new unit
                  </button>
                )}
              </div>

              {stockItems.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-gray-400 mb-1">
                    No units registered yet
                  </p>
                  <p className="text-xs text-gray-300">
                    Click &quot;Register unit&quot; to add your first IMEI
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "#F9FAFB" }}>
                        {[
                          "IMEI",
                          "Variant",
                          "Cost",
                          "Sold for",
                          "Profit",
                          "Status",
                          "Date",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stockItems.map((item, i) => {
                        const style = getStatusStyle(item.status);
                        return (
                          <tr
                            key={item.id}
                            style={{
                              borderTop: i > 0 ? "1px solid #F3F4F6" : "none",
                            }}
                          >
                            <td
                              className="px-4 py-3 font-mono text-xs"
                              style={{ color: "#0F6E56" }}
                            >
                              {item.imei}
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs">
                              {item.variant ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-gray-700 text-xs font-medium">
                              {fmt(Number(item.cost_price))}
                            </td>
                            <td className="px-4 py-3 text-gray-700 text-xs font-medium">
                              {item.sale
                                ? fmt(Number(item.sale.selling_price))
                                : "—"}
                            </td>
                            <td
                              className="px-4 py-3 text-xs font-bold"
                              style={{
                                color: item.sale ? "#16A34A" : "#9CA3AF",
                              }}
                            >
                              {item.sale ? fmt(Number(item.sale.profit)) : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                style={{
                                  backgroundColor: style.bg,
                                  color: style.color,
                                }}
                              >
                                {style.label}
                              </span>
                              {item.condition_notes && (
                                <p
                                  className="text-xs mt-1"
                                  style={{ color: "#9A3412" }}
                                >
                                  {item.condition_notes}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400">
                              {new Date(item.purchased_at).toLocaleDateString(
                                "en-NG",
                                { day: "numeric", month: "short" },
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {!selectedProduct && products.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-sm text-gray-400 mb-1">
              No serialized products yet
            </p>
            <p className="text-xs text-gray-300 mb-4">
              Add a smartphone or smart watch from the inventory page first
            </p>
            <button
              onClick={() => router.push("/inventory")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#0D3B2E" }}
            >
              Go to Inventory
            </button>
          </div>
        )}
      </div>
{/* Add unit modal */}
{showAddUnit && selectedProduct && (
  <div
    className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
    style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
  >
    <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-gray-900">Register units</h2>
          <p className="text-xs text-gray-400 mt-0.5">{selectedProduct.name} · add multiple at once</p>
        </div>
        <button
          onClick={() => { setShowAddUnit(false); setError(null); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="p-5 overflow-y-auto flex-1 space-y-4">

        {/* Purchase date — shared across all units */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Purchase date (applies to all units)</label>
          <input
            type="date"
            value={form.purchasedAt}
            onChange={(e) => setForm({ ...form, purchasedAt: e.target.value })}
            className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
            style={{ borderColor: "#E5E7EB" }}
          />
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-12 gap-2 px-1">
          <div className="col-span-4 text-xs font-semibold text-gray-500">IMEI *</div>
          <div className="col-span-4 text-xs font-semibold text-gray-500">Variant</div>
          <div className="col-span-3 text-xs font-semibold text-gray-500">Cost (₦)</div>
          <div className="col-span-1" />
        </div>

        {/* Unit rows */}
        <div className="space-y-2">
          {unitRows.map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={row.imei}
                onChange={(e) => updateRow(i, "imei", e.target.value)}
                placeholder="IMEI number"
                className="col-span-4 h-10 px-3 rounded-xl border text-sm outline-none font-mono"
                style={{ borderColor: row.imei && row.imei.length >= 10 ? "#1D9E75" : row.imei ? "#EF4444" : "#E5E7EB" }}
              />
              <input
                type="text"
                value={row.variant}
                onChange={(e) => updateRow(i, "variant", e.target.value)}
                placeholder="e.g. Black 64GB"
                className="col-span-4 h-10 px-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E5E7EB" }}
              />
              <input
                type="number"
                value={row.costPrice}
                onChange={(e) => updateRow(i, "costPrice", e.target.value)}
                placeholder="0"
                className="col-span-3 h-10 px-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E5E7EB" }}
              />
              <button
                onClick={() => removeRow(i)}
                disabled={unitRows.length === 1}
                className="col-span-1 h-10 flex items-center justify-center rounded-xl disabled:opacity-30"
                style={{ color: "#DC2626" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Add row button */}
        <button
          onClick={addRow}
          className="w-full h-10 rounded-xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition"
          style={{ borderColor: "#5DCAA5", color: "#0F6E56" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Add another unit
        </button>

        {error && (
          <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
            {error}
          </p>
        )}
      </div>

      <div className="px-5 py-4 border-t border-gray-100">
        <button
          onClick={handleAddUnit}
          disabled={loading || unitRows.every((r) => !r.imei.trim())}
          className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#0D3B2E" }}
        >
          {loading ? "Registering…" : `Register ${unitRows.filter((r) => r.imei.trim().length >= 10).length || ""} unit${unitRows.filter((r) => r.imei.trim().length >= 10).length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  </div>
)}

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 grid grid-cols-5 z-20"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Sales", href: "/sales" },
          { label: "Reports", href: "/reports" },
          { label: "More", href: "/settings" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center py-3 gap-1"
            style={{ color: "#9CA3AF" }}
          >
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
