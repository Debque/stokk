"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  brand_id: string | null;
  brandName: string;
  is_serialized: boolean;
  cost_price: number;
  selling_price: number;
  quantity: number;
  minimum_stock: number;
}

interface Purchase {
  id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier: string | null;
  purchased_at: string;
  notes: string | null;
}

interface Profile {
  role: string;
  store_name: string;
  full_name: string;
}

interface Props {
  product: Product;
  purchases: Purchase[];
  profile: Profile;
}

export default function StockClient({ product, purchases, profile }: Props) {
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    quantity: "",
    unitCost: String(product.cost_price ?? ""),
    supplier: "",
    purchasedAt: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

  const estimatedTotal = form.quantity && form.unitCost
    ? Number(form.quantity) * Number(form.unitCost)
    : 0;

  async function handleSubmit() {
    if (!form.quantity || Number(form.quantity) < 1) {
      setError("Quantity must be at least 1.");
      return;
    }
    if (!form.unitCost || Number(form.unitCost) < 0) {
      setError("Unit cost is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const qty = Number(form.quantity);
      const unitCost = Number(form.unitCost);

      // Insert stock purchase record
      const { error: purchaseError } = await supabase
        .from("stock_purchases")
        .insert({
          product_id: product.id,
          quantity: qty,
          unit_cost: unitCost,
          supplier: form.supplier.trim() || null,
          purchased_at: new Date(form.purchasedAt).toISOString(),
          notes: form.notes.trim() || null,
        });

      if (purchaseError) throw purchaseError;

      // Update product quantity
      const { error: productError } = await supabase
        .from("products")
        .update({
          quantity: product.quantity + qty,
          cost_price: unitCost, // Update default cost price
        })
        .eq("id", product.id);

      if (productError) throw productError;

      setSuccess(`Added ${qty} units of ${product.name}. New stock: ${product.quantity + qty}`);
      setForm({
        quantity: "",
        unitCost: String(unitCost),
        supplier: "",
        purchasedAt: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setShowForm(false);
      router.refresh();
      setTimeout(() => setSuccess(null), 5000);
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
        <div>
          <h1 className="text-lg font-bold text-gray-900">Add Stock</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {product.brandName} {product.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/inventory")}
            className="h-9 px-4 rounded-xl border text-sm font-medium"
            style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
          >
            ← Inventory
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="h-9 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
            style={{ backgroundColor: "#0D3B2E" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Add stock
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-5">

        {/* Success */}
        {success && (
          <div
            className="p-4 rounded-2xl text-sm font-medium flex items-center gap-3"
            style={{ backgroundColor: "#DCFCE7", color: "#14532D" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {success}
          </div>
        )}

        {/* Product summary card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{product.brandName} · Non-serialized</p>
            </div>
            <div className="text-right">
              <p
                className="text-2xl font-bold"
                style={{ color: product.quantity <= product.minimum_stock ? "#F97316" : "#0D3B2E" }}
              >
                {product.quantity}
              </p>
              <p className="text-xs text-gray-400">units in stock</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "Selling price", value: fmt(Number(product.selling_price)) },
              { label: "Cost price", value: fmt(Number(product.cost_price)) },
              { label: "Min. stock", value: String(product.minimum_stock) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-3 text-center"
                style={{ backgroundColor: "#F9FAFB" }}
              >
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className="text-sm font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>

          {product.quantity <= product.minimum_stock && (
            <div
              className="mt-4 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2"
              style={{ backgroundColor: "#FFF7ED", color: "#9A3412" }}
            >
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              Low stock — only {product.quantity} unit{product.quantity !== 1 ? "s" : ""} left (minimum: {product.minimum_stock})
            </div>
          )}
        </div>

        {/* Purchase history */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Stock purchase history</h2>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm font-medium"
              style={{ color: "#1D9E75" }}
            >
              + Add stock
            </button>
          </div>

          {purchases.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400 mb-1">No stock purchases yet</p>
              <p className="text-xs text-gray-300">Click &quot;Add stock&quot; to record your first restock</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#F9FAFB" }}>
                    {["Qty added", "Unit cost", "Total cost", "Supplier", "Date", "Notes"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase, i) => (
                    <tr
                      key={purchase.id}
                      style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}
                    >
                      <td className="px-4 py-3 font-bold" style={{ color: "#16A34A" }}>
                        +{purchase.quantity}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{fmt(Number(purchase.unit_cost))}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {fmt(Number(purchase.total_cost))}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{purchase.supplier ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(purchase.purchased_at).toLocaleDateString("en-NG", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{purchase.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add stock modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Add stock</h2>
                <p className="text-xs text-gray-400 mt-0.5">{product.brandName} {product.name}</p>
              </div>
              <button
                onClick={() => { setShowForm(false); setError(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Quantity to add *
                  <span className="text-gray-400 font-normal ml-1">
                    ({product.quantity} currently in stock)
                  </span>
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="e.g. 20"
                  min="1"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: form.quantity ? "#1D9E75" : "#E5E7EB" }}
                />
              </div>

              {/* Unit cost */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Unit cost (₦) *</label>
                <input
                  type="number"
                  value={form.unitCost}
                  onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                  placeholder="0"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: form.unitCost ? "#1D9E75" : "#E5E7EB" }}
                />
              </div>

              {/* Total cost preview */}
              {estimatedTotal > 0 && (
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ backgroundColor: "#E1F5EE" }}
                >
                  <span className="text-sm font-medium" style={{ color: "#0F6E56" }}>
                    Total cost
                  </span>
                  <span className="text-lg font-bold" style={{ color: "#0D3B2E" }}>
                    {fmt(estimatedTotal)}
                  </span>
                </div>
              )}

              {/* Supplier */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Supplier (optional)</label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  placeholder="e.g. Slot Systems"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#E5E7EB" }}
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Purchase date</label>
                <input
                  type="date"
                  value={form.purchasedAt}
                  onChange={(e) => setForm({ ...form, purchasedAt: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#E5E7EB" }}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional details"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#E5E7EB" }}
                />
              </div>

              {error && (
                <p
                  className="text-sm px-3 py-2 rounded-xl"
                  style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                >
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !form.quantity || !form.unitCost}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#0D3B2E" }}
              >
                {loading ? "Adding stock…" : `Add ${form.quantity || 0} units`}
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
          
            <a key={item.href}
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