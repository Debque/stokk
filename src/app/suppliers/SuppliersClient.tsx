"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MobileMenuButton from "@/components/MobileMenuButton";

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

interface Purchase {
  id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier: string | null;
  purchased_at: string;
}

interface Product {
  id: string;
  name: string;
}

interface Profile {
  role: string;
  store_name: string;
  full_name: string;
}

interface Props {
  suppliers: Supplier[];
  purchases: Purchase[];
  products: Product[];
  profile: Profile;
}

export default function SuppliersClient({ suppliers, purchases, products, profile }: Props) {
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<Supplier | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "", notes: "" });

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

  function getProductName(productId: string) {
    return products.find((p) => p.id === productId)?.name ?? "Unknown product";
  }

  function getSupplierPurchases(supplierName: string) {
    return purchases.filter((p) => p.supplier === supplierName);
  }

  function getSupplierTotal(supplierName: string) {
    return getSupplierPurchases(supplierName).reduce((sum, p) => sum + Number(p.total_cost), 0);
  }

  function openEditModal(supplier: Supplier) {
    setEditForm({ name: supplier.name, phone: supplier.phone ?? "", address: supplier.address ?? "", notes: supplier.notes ?? "" });
    setShowEditForm(supplier);
    setError(null);
  }

  async function handleAdd() {
    if (!form.name) { setError("Supplier name is required."); return; }
    setLoading(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from("suppliers").insert({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      });
      if (insertError) throw insertError;
      setForm({ name: "", phone: "", address: "", notes: "" });
      setShowForm(false);
      setSuccess("Supplier added successfully.");
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit() {
    if (!editForm.name) { setError("Supplier name is required."); return; }
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("suppliers")
        .update({ name: editForm.name.trim(), phone: editForm.phone.trim() || null, address: editForm.address.trim() || null, notes: editForm.notes.trim() || null })
        .eq("id", showEditForm!.id);
      if (updateError) throw updateError;
      setShowEditForm(null);
      setSuccess("Supplier updated.");
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!showDeleteConfirm) return;
    setDeleteLoading(true);
    try {
      const { error: deleteError } = await supabase.from("suppliers").delete().eq("id", showDeleteConfirm.id);
      if (deleteError) throw deleteError;
      setShowDeleteConfirm(null);
      setSuccess("Supplier deleted.");
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeleteLoading(false);
    }
  }

  const totalSpend = purchases.reduce((sum, p) => sum + Number(p.total_cost), 0);

  return (
    <div style={{ backgroundColor: "var(--bg-subtle)", minHeight: "100vh" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 py-4 border-b"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Suppliers</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""} · {profile.store_name}
            </p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--brand-primary)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Add supplier
        </button>
      </div>

      <div className="p-4 lg:p-6 space-y-5">

        {success && (
          <div className="p-4 rounded-2xl text-sm font-medium flex items-center gap-3"
            style={{ backgroundColor: "var(--bg-success)", color: "var(--color-success-dark)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)", borderLeft: "4px solid var(--brand-mid)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Total suppliers</p>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{suppliers.length}</p>
          </div>
          <div className="rounded-2xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)", borderLeft: "4px solid var(--brand-primary)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Total purchased</p>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{fmt(totalSpend)}</p>
          </div>
        </div>

        {/* Suppliers list */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>All suppliers</h2>
          </div>

          {suppliers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--bg-green)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="var(--brand-mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No suppliers yet</p>
              <p className="text-xs mb-4" style={{ color: "var(--text-faint)" }}>Add your suppliers to track where you buy from</p>
              <button onClick={() => setShowForm(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--brand-primary)" }}>
                Add first supplier
              </button>
            </div>
          ) : (
            <div>
              {suppliers.map((supplier, i) => {
                const supplierPurchases = getSupplierPurchases(supplier.name);
                const supplierTotal = getSupplierTotal(supplier.name);
                return (
                  <div
                    key={supplier.id}
                    className="flex items-center justify-between px-5 py-4 cursor-pointer transition"
                    style={{ borderBottom: i < suppliers.length - 1 ? `1px solid var(--border-subtle)` : "none" }}
                    onClick={() => setSelectedSupplier(supplier)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: "var(--bg-green)", color: "var(--brand-dark)" }}>
                        {supplier.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{supplier.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {supplier.phone && <span className="text-xs" style={{ color: "var(--text-faint)" }}>{supplier.phone}</span>}
                          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                            {supplierPurchases.length} purchase{supplierPurchases.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{fmt(supplierTotal)}</p>
                        <p className="text-xs" style={{ color: "var(--text-faint)" }}>total bought</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button onClick={(e) => { e.stopPropagation(); openEditModal(supplier); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                          style={{ color: "var(--text-muted)" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(supplier); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                          style={{ color: "var(--color-loss)" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Supplier detail modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden max-h-[85vh] flex flex-col" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: "var(--bg-green)", color: "var(--brand-dark)" }}>
                  {selectedSupplier.name[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{selectedSupplier.name}</h2>
                  {selectedSupplier.phone && <p className="text-xs" style={{ color: "var(--text-faint)" }}>{selectedSupplier.phone}</p>}
                </div>
              </div>
              <button onClick={() => setSelectedSupplier(null)} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: "var(--text-faint)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 border-b space-y-2" style={{ borderColor: "var(--border-subtle)" }}>
              {selectedSupplier.address && (
                <div className="flex items-start gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="var(--text-faint)" strokeWidth="2"/>
                    <circle cx="12" cy="10" r="3" stroke="var(--text-faint)" strokeWidth="2"/>
                  </svg>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{selectedSupplier.address}</p>
                </div>
              )}
              {selectedSupplier.notes && (
                <div className="flex items-start gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{selectedSupplier.notes}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>Total purchased</span>
                <span className="text-sm font-bold" style={{ color: "var(--brand-primary)" }}>
                  {fmt(getSupplierTotal(selectedSupplier.name))}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Purchase history</p>
              </div>
              {getSupplierPurchases(selectedSupplier.name).length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm" style={{ color: "var(--text-faint)" }}>No purchases recorded for this supplier yet</p>
                  <p className="text-xs mt-1" style={{ color: "var(--border-strong)" }}>When you add stock and enter this supplier&apos;s name, it will appear here</p>
                </div>
              ) : (
                <div>
                  {getSupplierPurchases(selectedSupplier.name).map((purchase, i) => (
                    <div key={purchase.id} className="flex items-center justify-between px-5 py-3"
                      style={{ borderBottom: i < getSupplierPurchases(selectedSupplier.name).length - 1 ? `1px solid var(--border-subtle)` : "none" }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{getProductName(purchase.product_id)}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                          {purchase.quantity} units · {new Date(purchase.purchased_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{fmt(Number(purchase.total_cost))}</p>
                        <p className="text-xs" style={{ color: "var(--text-faint)" }}>{fmt(Number(purchase.unit_cost))}/unit</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add supplier modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Add supplier</h2>
              <button onClick={() => { setShowForm(false); setError(null); }} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: "var(--text-faint)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "Supplier name *", key: "name", placeholder: "e.g. Slot Systems", required: true },
                { label: "Phone number", key: "phone", placeholder: "e.g. 08012345678", required: false },
                { label: "Address", key: "address", placeholder: "e.g. Computer Village, Ikeja", required: false },
                { label: "Notes", key: "notes", placeholder: "Any additional details", required: false },
              ].map(({ label, key, placeholder, required }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{label}</label>
                  <input type="text" value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: required && form[key as keyof typeof form] ? "var(--brand-mid)" : "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}/>
                </div>
              ))}
              {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--bg-danger)", color: "var(--color-loss)" }}>{error}</p>}
              <button onClick={handleAdd} disabled={loading || !form.name}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--brand-primary)" }}>
                {loading ? "Saving…" : "Add supplier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit supplier modal */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Edit supplier</h2>
              <button onClick={() => { setShowEditForm(null); setError(null); }} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: "var(--text-faint)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "Supplier name *", key: "name", required: true },
                { label: "Phone number", key: "phone", required: false },
                { label: "Address", key: "address", required: false },
                { label: "Notes", key: "notes", required: false },
              ].map(({ label, key, required }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{label}</label>
                  <input type="text" value={editForm[key as keyof typeof editForm]}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: required && editForm[key as keyof typeof editForm] ? "var(--brand-mid)" : "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}/>
                </div>
              ))}
              {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--bg-danger)", color: "var(--color-loss)" }}>{error}</p>}
              <button onClick={handleEdit} disabled={loading || !editForm.name}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--brand-primary)" }}>
                {loading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "var(--bg-danger)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="var(--color-loss)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>Delete {showDeleteConfirm.name}?</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>This supplier will be removed. Purchase history will be preserved.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 h-11 rounded-xl border text-sm font-semibold"
                  style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleteLoading}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-danger)" }}>
                  {deleteLoading ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t grid grid-cols-5 z-20"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Sales", href: "/sales" },
          { label: "Reports", href: "/reports" },
          { label: "More", href: "/settings" },
        ].map((item) => (
          <a key={item.href} href={item.href} className="flex flex-col items-center justify-center py-3 gap-1"
            style={{ color: "var(--text-faint)" }}>
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}