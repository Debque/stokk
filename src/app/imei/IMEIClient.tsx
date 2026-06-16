"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
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
  image_url: string | null;
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
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<StockItem | null | "not_found">(null);

  const [form, setForm] = useState({
    purchasedAt: new Date().toISOString().split("T")[0],
  });

  const [unitRows, setUnitRows] = useState([
    { imei: "", variant: "", costPrice: selectedProduct ? String(selectedProduct.cost_price) : "", imageFile: null as File | null, imagePreview: "" }
  ]);

  function addRow() {
    setUnitRows([...unitRows, {
      imei: "", variant: "",
      costPrice: selectedProduct ? String(selectedProduct.cost_price) : "",
      imageFile: null,
      imagePreview: "",
    }]);
  }

  function removeRow(index: number) {
    if (unitRows.length === 1) return;
    setUnitRows(unitRows.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: string, value: string) {
    setUnitRows(unitRows.map((row, i) => i === index ? { ...row, [field]: value } : row));
  }

  function handleRowImage(index: number, file: File | null) {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setUnitRows(unitRows.map((row, i) => i === index ? { ...row, imageFile: file, imagePreview: preview } : row));
  }

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

  function getStatusStyle(status: string) {
    switch (status) {
      case "in_stock": return { bg: "var(--bg-success)", color: "var(--color-success-dark)", label: "In stock" };
      case "sold": return { bg: "var(--bg-green)", color: "var(--brand-dark)", label: "Sold" };
      case "faulty": return { bg: "var(--bg-danger)", color: "var(--color-loss)", label: "Faulty" };
      case "returned": return { bg: "var(--bg-warning)", color: "var(--color-warning-dark)", label: "Returned" };
      default: return { bg: "var(--border-subtle)", color: "var(--text-muted)", label: status };
    }
  }

  function handleSearch() {
    if (!imeiSearch.trim()) return;
    const found = stockItems.find(
      (item) => item.imei.toLowerCase() === imeiSearch.trim().toLowerCase()
    );
    setSearchResult(found ?? "not_found");
  }

  async function handleAddUnit() {
    if (!selectedProduct) return;

    const validRows = unitRows.filter((r) => r.imei.trim().length >= 10);
    if (validRows.length === 0) {
      setError("Add at least one valid IMEI (minimum 10 digits).");
      return;
    }

    const invalidRows = unitRows.filter((r) => r.imei.trim() && r.imei.trim().length < 10);
    if (invalidRows.length > 0) {
      setError("Some IMEIs are too short. Each IMEI must be at least 10 digits.");
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

      const { error: insertError } = await supabase.from("stock_items").insert(inserts);

      if (insertError) {
        if (insertError.message.includes("unique")) {
          setError("One or more IMEIs are already registered in the system.");
        } else {
          throw insertError;
        }
        return;
      }

      const { data: insertedItems } = await supabase
        .from("stock_items")
        .select("id, imei")
        .eq("product_id", selectedProduct.id)
        .in("imei", validRows.map((r) => r.imei.trim()));

      if (insertedItems) {
        for (const row of validRows) {
          if (row.imageFile) {
            const stockItem = insertedItems.find((s) => s.imei === row.imei.trim());
            if (stockItem) {
              const timestamp = new Date().getTime();
              const ext = row.imageFile.name.split(".").pop();
              const filename = `unit-${stockItem.id}-${timestamp}.${ext}`;
              const { error: uploadError } = await supabase.storage
                .from("product-images")
                .upload(filename, row.imageFile, { upsert: true });
              if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                  .from("product-images")
                  .getPublicUrl(filename);
                await supabase
                  .from("stock_items")
                  .update({ image_url: publicUrl })
                  .eq("id", stockItem.id);
              }
            }
          }
        }
      }

      setUnitRows([{
        imei: "", variant: "",
        costPrice: String(selectedProduct.cost_price),
        imageFile: null,
        imagePreview: "",
      }]);
      setShowAddUnit(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnitImageUpload(e: React.ChangeEvent<HTMLInputElement>, stockItemId: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("Image must be under 4MB.");
      return;
    }

    setUploadingId(stockItemId);
    const timestamp = new Date().getTime();

    try {
      const ext = file.name.split(".").pop();
      const filename = `unit-${stockItemId}-${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filename, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filename);

      const { error: updateError } = await supabase
        .from("stock_items")
        .update({ image_url: publicUrl })
        .eq("id", stockItemId);

      if (updateError) throw updateError;

      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div style={{ backgroundColor: "var(--bg-subtle)", minHeight: "100vh" }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 py-4 border-b"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>IMEI Tracker</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Serialized units — {profile.store_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/inventory")}
            className="h-9 px-4 rounded-xl border text-sm font-medium"
            style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}
          >
            ← Inventory
          </button>
          {isOwner && selectedProduct && (
            <button
              onClick={() => setShowAddUnit(true)}
              className="h-9 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
              style={{ backgroundColor: "var(--brand-primary)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Register unit
            </button>
          )}
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-5">

        {/* Product selector */}
        <div className="rounded-2xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
          <label className="text-sm font-medium block mb-2" style={{ color: "var(--text-secondary)" }}>Select product</label>
          <select
            value={initialProductId ?? ""}
            onChange={(e) => router.push(`/imei?product=${e.target.value}`)}
            className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}
          >
            <option value="">— Choose a serialized product —</option>
            {products.map((p) => {
              const brand = brands.find((b) => b.id === p.brand_id);
              const brandPrefix = brand && !p.name.toLowerCase().startsWith(brand.name.toLowerCase())
                ? `${brand.name} ` : "";
              return <option key={p.id} value={p.id}>{brandPrefix}{p.name}</option>;
            })}
          </select>
        </div>

        {selectedProduct && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Total registered", value: stats.totalRegistered, borderColor: "var(--brand-mid)", dangerIfPositive: false },
                { label: "In stock", value: stats.inStock, borderColor: "var(--color-profit)", dangerIfPositive: false },
                { label: "Sold this month", value: stats.sold, borderColor: "var(--brand-dark)", dangerIfPositive: false },
                { label: "Faulty / returned", value: stats.faulty, borderColor: "var(--color-danger)", dangerIfPositive: true },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border p-4"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border-subtle)",
                    borderLeft: `4px solid ${stat.borderColor}`,
                  }}
                >
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: stat.dangerIfPositive && stat.value > 0 ? "var(--color-danger)" : "var(--text-primary)" }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* IMEI Search */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
              <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Search by IMEI</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imeiSearch}
                  onChange={(e) => { setImeiSearch(e.target.value); setSearchResult(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Enter IMEI number..."
                  className="flex-1 h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}
                />
                <button
                  onClick={handleSearch}
                  className="h-11 px-5 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: "var(--brand-primary)" }}
                >
                  Search
                </button>
              </div>

              {searchResult === "not_found" && (
                <div className="mt-3 p-3 rounded-xl text-sm" style={{ backgroundColor: "var(--bg-danger)", color: "var(--color-loss)" }}>
                  No unit found with IMEI {imeiSearch}
                </div>
              )}

              {searchResult && searchResult !== "not_found" && (
                <div className="mt-3 p-4 rounded-xl" style={{ backgroundColor: "var(--bg-green)", border: "1px solid var(--brand-light)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold" style={{ color: "var(--brand-primary)" }}>
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
                      { label: "Purchased", value: new Date(searchResult.purchased_at).toLocaleDateString("en-NG") },
                      { label: "Cost price", value: fmt(Number(searchResult.cost_price)) },
                      { label: "Sold for", value: searchResult.sale ? fmt(Number(searchResult.sale.selling_price)) : "—" },
                      { label: "Profit", value: searchResult.sale ? fmt(Number(searchResult.sale.profit)) : "—" },
                    ].map((field) => (
                      <div key={field.label}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>{field.label}</p>
                        <p className="text-sm font-bold" style={{ color: "var(--brand-primary)" }}>{field.value}</p>
                      </div>
                    ))}
                  </div>
                  {searchResult.condition_notes && (
                    <div className="mt-3 p-2.5 rounded-lg" style={{ backgroundColor: "var(--bg-warning)" }}>
                      <p className="text-xs font-semibold" style={{ color: "var(--color-warning-dark)" }}>Condition note</p>
                      <p className="text-sm mt-0.5" style={{ color: "var(--color-warning-dark)" }}>{searchResult.condition_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Units table */}
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {selectedProduct.name} — all registered units
                </p>
                {isOwner && (
                  <button onClick={() => setShowAddUnit(true)} className="text-sm font-medium" style={{ color: "var(--brand-mid)" }}>
                    + Register new unit
                  </button>
                )}
              </div>

              {stockItems.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm mb-1" style={{ color: "var(--text-faint)" }}>No units registered yet</p>
                  <p className="text-xs" style={{ color: "var(--border-strong)" }}>Click &quot;Register unit&quot; to add your first IMEI</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "var(--bg-subtle)" }}>
                        {["Photo", "IMEI", "Variant", "Cost", "Sold for", "Profit", "Status", "Date"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stockItems.map((item, i) => {
                        const style = getStatusStyle(item.status);
                        return (
                          <tr key={item.id} style={{ borderTop: i > 0 ? `1px solid var(--border-subtle)` : "none" }}>
                            <td className="px-4 py-3">
                              <label
                                className="relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group flex-shrink-0"
                                style={{ backgroundColor: "var(--border-subtle)" }}
                              >
                                {item.image_url ? (
                                  <Image src={item.image_url} alt="unit" fill className="object-cover"/>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <circle cx="12" cy="13" r="4" stroke="var(--text-faint)" strokeWidth="2"/>
                                  </svg>
                                )}
                                {isOwner && (
                                  <>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2"/>
                                      </svg>
                                    </div>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleUnitImageUpload(e, item.id)}
                                      disabled={uploadingId === item.id}
                                    />
                                  </>
                                )}
                                {uploadingId === item.id && (
                                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                                      <circle cx="12" cy="12" r="10" stroke="var(--bg-green)" strokeWidth="3"/>
                                      <path d="M12 2a10 10 0 0110 10" stroke="var(--brand-mid)" strokeWidth="3" strokeLinecap="round"/>
                                    </svg>
                                  </div>
                                )}
                              </label>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--brand-dark)" }}>{item.imei}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{item.variant ?? "—"}</td>
                            <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{fmt(Number(item.cost_price))}</td>
                            <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                              {item.sale ? fmt(Number(item.sale.selling_price)) : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs font-bold" style={{ color: item.sale ? "var(--color-profit)" : "var(--text-faint)" }}>
                              {item.sale ? fmt(Number(item.sale.profit)) : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                style={{ backgroundColor: style.bg, color: style.color }}
                              >
                                {style.label}
                              </span>
                              {item.condition_notes && (
                                <p className="text-xs mt-1" style={{ color: "var(--color-warning-dark)" }}>{item.condition_notes}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: "var(--text-faint)" }}>
                              {new Date(item.purchased_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
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
          <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--text-faint)" }}>No serialized products yet</p>
            <p className="text-xs mb-4" style={{ color: "var(--border-strong)" }}>Add a smartphone or smart watch from the inventory page first</p>
            <button
              onClick={() => router.push("/inventory")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--brand-primary)" }}
            >
              Go to Inventory
            </button>
          </div>
        )}
      </div>

      {/* Add unit modal */}
      {showAddUnit && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Register units</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{selectedProduct.name} · add multiple at once</p>
              </div>
              <button
                onClick={() => { setShowAddUnit(false); setError(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ color: "var(--text-faint)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Purchase date (applies to all units)</label>
                <input
                  type="date"
                  value={form.purchasedAt}
                  onChange={(e) => setForm({ ...form, purchasedAt: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}
                />
              </div>

              <div className="space-y-3">
                {unitRows.map((row, i) => (
                  <div key={i} className="p-3 rounded-xl border space-y-2" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Unit {i + 1}</span>
                      <button
                        onClick={() => removeRow(i)}
                        disabled={unitRows.length === 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-30"
                        style={{ color: "var(--color-danger)" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={row.imei}
                      onChange={(e) => updateRow(i, "imei", e.target.value)}
                      placeholder="IMEI number *"
                      className="w-full h-10 px-3 rounded-xl border text-sm outline-none font-mono"
                      style={{
                        borderColor: row.imei && row.imei.length >= 10 ? "var(--brand-mid)" : row.imei ? "var(--color-danger)" : "var(--border-default)",
                        backgroundColor: "var(--bg-card)",
                        color: "var(--text-primary)",
                      }}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={row.variant}
                        onChange={(e) => updateRow(i, "variant", e.target.value)}
                        placeholder="Variant e.g. Black 64GB"
                        className="h-10 px-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}
                      />
                      <input
                        type="number"
                        value={row.costPrice}
                        onChange={(e) => updateRow(i, "costPrice", e.target.value)}
                        placeholder="Cost (₦)"
                        className="h-10 px-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}
                      />
                    </div>

                    <label
                      className="w-full h-20 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden relative"
                      style={{ borderColor: row.imagePreview ? "var(--brand-mid)" : "var(--border-default)" }}
                    >
                      {row.imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.imagePreview} alt="preview" className="w-full h-full object-cover"/>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="13" r="4" stroke="var(--text-faint)" strokeWidth="2"/>
                          </svg>
                          <span className="text-xs" style={{ color: "var(--text-faint)" }}>Tap to add photo</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleRowImage(i, e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <button
                onClick={addRow}
                className="w-full h-10 rounded-xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition"
                style={{ borderColor: "var(--brand-light)", color: "var(--brand-dark)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                Add another unit
              </button>

              {error && (
                <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--bg-danger)", color: "var(--color-loss)" }}>{error}</p>
              )}
            </div>

            <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <button
                onClick={handleAddUnit}
                disabled={loading || unitRows.every((r) => !r.imei.trim())}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--brand-primary)" }}
              >
                {loading ? "Registering…" : `Register ${unitRows.filter((r) => r.imei.trim().length >= 10).length || ""} unit${unitRows.filter((r) => r.imei.trim().length >= 10).length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 border-t grid grid-cols-5 z-20"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Sales", href: "/sales" },
          { label: "Reports", href: "/reports" },
          { label: "More", href: "/settings" },
        ].map((item) => (
          <a key={item.href} href={item.href} className="flex flex-col items-center justify-center py-3 gap-1" style={{ color: "var(--text-faint)" }}>
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}