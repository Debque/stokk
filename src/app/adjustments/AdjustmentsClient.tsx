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
  quantity: number;
  minimum_stock: number;
  currentStock: number;
}

interface Brand {
  id: string;
  name: string;
}

interface Adjustment {
  id: string;
  product_id: string;
  quantity_change: number;
  reason: string;
  notes: string | null;
  adjusted_at: string;
}

interface Profile {
  role: string;
  store_name: string;
  full_name: string;
}

interface Props {
  products: Product[];
  brands: Brand[];
  adjustments: Adjustment[];
  profile: Profile;
}

const REASONS = [
  { value: "damaged", label: "Damaged", color: "#EF4444" },
  { value: "theft", label: "Theft", color: "#DC2626" },
  { value: "correction", label: "Stock correction", color: "#6366F1" },
  { value: "returned", label: "Customer return", color: "#F97316" },
  { value: "other", label: "Other", color: "#9CA3AF" },
];

export default function AdjustmentsClient({
  products,
  brands,
  adjustments,
  profile,
}: Props) {
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    productId: "",
    quantityChange: "",
    adjustmentType: "remove" as "add" | "remove",
    reason: "correction",
    notes: "",
    adjustedAt: new Date().toISOString().split("T")[0],
  });

  const selectedProduct = products.find((p) => p.id === form.productId);

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

  function getReasonStyle(reason: string) {
    return REASONS.find((r) => r.value === reason) ?? REASONS[REASONS.length - 1];
  }

  function getProductName(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return "Unknown product";
    const brand = brands.find((b) => b.id === product.brand_id);
    return brand ? `${brand.name} ${product.name}` : product.name;
  }

  async function handleSubmit() {
    if (!form.productId) {
      setError("Please select a product.");
      return;
    }
    if (!form.quantityChange || Number(form.quantityChange) <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }
    if (selectedProduct?.is_serialized) {
      setError("Serialized products (IMEI tracked) cannot be adjusted here. Use the IMEI Tracker to manage individual units.");
      return;
    }

    const qty = Number(form.quantityChange);
    const change = form.adjustmentType === "remove" ? -qty : qty;

    // Check if removal would make stock negative
    if (change < 0 && selectedProduct && selectedProduct.currentStock + change < 0) {
      setError(`Cannot remove ${qty} units. Only ${selectedProduct.currentStock} in stock.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Insert adjustment record
      const { error: adjustError } = await supabase
        .from("stock_adjustments")
        .insert({
          product_id: form.productId,
          quantity_change: change,
          reason: form.reason,
          notes: form.notes.trim() || null,
          adjusted_at: new Date(form.adjustedAt).toISOString(),
        });

      if (adjustError) throw adjustError;

      // Update product quantity
      const newQty = (selectedProduct?.quantity ?? 0) + change;
      const { error: productError } = await supabase
        .from("products")
        .update({ quantity: Math.max(0, newQty) })
        .eq("id", form.productId);

      if (productError) throw productError;

      setForm({
        productId: "",
        quantityChange: "",
        adjustmentType: "remove",
        reason: "correction",
        notes: "",
        adjustedAt: new Date().toISOString().split("T")[0],
      });
      setShowForm(false);
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
          <h1 className="text-lg font-bold text-gray-900">Stock Adjustments</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manual stock corrections — {profile.store_name}
          </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: "#0D3B2E" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          New adjustment
        </button>
      </div>

      <div className="p-4 lg:p-6 space-y-5">

        {/* Info box */}
        <div
          className="p-4 rounded-2xl text-sm"
          style={{ backgroundColor: "#E1F5EE", border: "1px solid #5DCAA5" }}
        >
          <p className="font-semibold mb-1" style={{ color: "#0D3B2E" }}>When to use stock adjustments</p>
          <p className="text-xs leading-relaxed" style={{ color: "#0F6E56" }}>
            Use this page to correct stock levels for non-serialized products (chargers, cases, accessories) 
            when units are damaged, lost to theft, or miscounted. For serialized products (phones), 
            use the IMEI Tracker to change individual unit status.
          </p>
        </div>

        {/* Adjustments list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent adjustments</h2>
          </div>

          {adjustments.length === 0 ? (
            <div className="p-12 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#E1F5EE" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="6" r="2" fill="#1D9E75"/>
                  <circle cx="15" cy="12" r="2" fill="#1D9E75"/>
                  <circle cx="9" cy="18" r="2" fill="#1D9E75"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">No adjustments yet</p>
              <p className="text-xs text-gray-400 mb-4">
                Stock adjustments are logged here for full audit trail
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "#0D3B2E" }}
              >
                Make first adjustment
              </button>
            </div>
          ) : (
            <div>
              {adjustments.map((adj, i) => {
                const reasonStyle = getReasonStyle(adj.reason);
                const isPositive = adj.quantity_change > 0;
                return (
                  <div
                    key={adj.id}
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: i < adjustments.length - 1 ? "1px solid #F3F4F6" : "none" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{
                          backgroundColor: isPositive ? "#DCFCE7" : "#FEE2E2",
                          color: isPositive ? "#16A34A" : "#DC2626",
                        }}
                      >
                        {isPositive ? "+" : "−"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {getProductName(adj.product_id)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${reasonStyle.color}15`,
                              color: reasonStyle.color,
                            }}
                          >
                            {reasonStyle.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(adj.adjusted_at).toLocaleDateString("en-NG", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                        </div>
                        {adj.notes && (
                          <p className="text-xs text-gray-400 mt-0.5">{adj.notes}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: isPositive ? "#16A34A" : "#DC2626" }}
                    >
                      {isPositive ? "+" : ""}{adj.quantity_change} units
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add adjustment modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">New stock adjustment</h2>
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

              {/* Product selector */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Product *</label>
                <select
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none bg-white"
                  style={{ borderColor: form.productId ? "#1D9E75" : "#E5E7EB" }}
                >
                  <option value="">— Select a product —</option>
                  {products
                    .filter((p) => !p.is_serialized)
                    .map((p) => {
                      const brand = brands.find((b) => b.id === p.brand_id);
                      return (
                        <option key={p.id} value={p.id}>
                          {brand ? `${brand.name} ` : ""}{p.name} ({p.currentStock} in stock)
                        </option>
                      );
                    })}
                </select>
                {products.filter((p) => !p.is_serialized).length === 0 && (
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    No non-serialized products found. Add accessories or chargers from inventory first.
                  </p>
                )}
              </div>

              {/* Add or remove toggle */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Adjustment type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "add", label: "Add stock", color: "#16A34A", bg: "#DCFCE7" },
                    { value: "remove", label: "Remove stock", color: "#DC2626", bg: "#FEE2E2" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setForm({ ...form, adjustmentType: type.value as "add" | "remove" })}
                      className="h-11 rounded-xl text-sm font-semibold border-2 transition"
                      style={{
                        backgroundColor: form.adjustmentType === type.value ? type.bg : "#fff",
                        borderColor: form.adjustmentType === type.value ? type.color : "#E5E7EB",
                        color: form.adjustmentType === type.value ? type.color : "#6B7280",
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Quantity *
                  {selectedProduct && (
                    <span className="text-gray-400 font-normal ml-1">
                      ({selectedProduct.currentStock} currently in stock)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={form.quantityChange}
                  onChange={(e) => setForm({ ...form, quantityChange: e.target.value })}
                  placeholder="0"
                  min="1"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: form.quantityChange ? "#1D9E75" : "#E5E7EB" }}
                />
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Reason</label>
                <div className="grid grid-cols-2 gap-2">
                  {REASONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setForm({ ...form, reason: r.value })}
                      className="h-10 rounded-xl text-xs font-semibold border-2 transition px-3"
                      style={{
                        backgroundColor: form.reason === r.value ? `${r.color}15` : "#fff",
                        borderColor: form.reason === r.value ? r.color : "#E5E7EB",
                        color: form.reason === r.value ? r.color : "#6B7280",
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Found damaged in storage"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#E5E7EB" }}
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={form.adjustedAt}
                  onChange={(e) => setForm({ ...form, adjustedAt: e.target.value })}
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
                disabled={loading || !form.productId || !form.quantityChange}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#0D3B2E" }}
              >
                {loading ? "Saving…" : "Save adjustment"}
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