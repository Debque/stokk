"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MobileMenuButton from "@/components/MobileMenuButton";

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  notes: string | null;
}

interface Profile {
  role: string;
  store_name: string;
  full_name: string;
}

interface Props {
  expenses: Expense[];
  totalThisMonth: number;
  categoryTotals: Record<string, number>;
  profile: Profile;
}

const CATEGORIES = [
  "Rent",
  "Electricity",
  "Staff Salaries",
  "Internet",
  "Transport",
  "Equipment",
  "Marketing",
  "Repairs",
  "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  Rent: "#0F6E56",
  Electricity: "#F97316",
  "Staff Salaries": "#1D9E75",
  Internet: "#6366F1",
  Transport: "#EC4899",
  Equipment: "#14B8A6",
  Marketing: "#F59E0B",
  Repairs: "#EF4444",
  Other: "#9CA3AF",
};

export default function ExpensesClient({
  expenses,
  totalThisMonth,
  categoryTotals,
  profile,
}: Props) {
  const router = useRouter();
  const isOwner = profile.role === "owner";

  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<Expense | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    category: "Rent",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    title: "",
    category: "Rent",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
  const monthName = new Date().toLocaleString("en-NG", { month: "long", year: "numeric" });

  function openEditModal(expense: Expense) {
    setEditForm({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      expense_date: expense.expense_date,
      notes: expense.notes ?? "",
    });
    setShowEditForm(expense);
    setError(null);
  }

  async function handleSubmit() {
    if (!form.title || !form.amount) { setError("Title and amount are required."); return; }
    if (Number(form.amount) <= 0) { setError("Amount must be greater than 0."); return; }

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("expenses").insert({
        title: form.title.trim(),
        category: form.category,
        amount: Number(form.amount),
        expense_date: form.expense_date,
        notes: form.notes.trim() || null,
      });

      if (insertError) throw insertError;

      setForm({ title: "", category: "Rent", amount: "", expense_date: new Date().toISOString().split("T")[0], notes: "" });
      setShowForm(false);
      setSuccess("Expense added successfully.");
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEditSubmit() {
    if (!editForm.title || !editForm.amount) { setError("Title and amount are required."); return; }
    if (Number(editForm.amount) <= 0) { setError("Amount must be greater than 0."); return; }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("expenses")
        .update({
          title: editForm.title.trim(),
          category: editForm.category,
          amount: Number(editForm.amount),
          expense_date: editForm.expense_date,
          notes: editForm.notes.trim() || null,
        })
        .eq("id", showEditForm!.id);

      if (updateError) throw updateError;

      setShowEditForm(null);
      setSuccess("Expense updated successfully.");
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
      const { error: deleteError } = await supabase
        .from("expenses")
        .delete()
        .eq("id", showDeleteConfirm.id);

      if (deleteError) throw deleteError;

      setShowDeleteConfirm(null);
      setSuccess("Expense deleted.");
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeleteLoading(false);
    }
  }

  const maxCategory = Math.max(...Object.values(categoryTotals), 1);

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
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Expenses</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{monthName}</p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Add expense
          </button>
        )}
      </div>

      <div className="p-4 lg:p-6 space-y-5">

        {/* Success */}
        {success && (
          <div className="p-4 rounded-2xl text-sm font-medium flex items-center gap-3"
            style={{ backgroundColor: "var(--bg-success)", color: "var(--color-success-dark)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {success}
          </div>
        )}

        {/* Total card */}
        <div
          className="rounded-2xl p-5 border"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--bg-danger)",
            borderLeft: "4px solid var(--color-danger)",
          }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Total expenses — {monthName}</p>
          <p className="text-3xl font-bold" style={{ color: "var(--color-danger)" }}>{fmt(totalThisMonth)}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""} recorded
          </p>
        </div>

        {/* Category breakdown */}
        {Object.keys(categoryTotals).length > 0 && (
          <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>By category</h2>
            <div className="space-y-3">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amount]) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] ?? "var(--text-faint)" }}/>
                        <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{cat}</span>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(amount)}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-subtle)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round((amount / maxCategory) * 100)}%`,
                          backgroundColor: CATEGORY_COLORS[cat] ?? "var(--text-faint)",
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Expenses list */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>All expenses this month</h2>
          </div>

          {expenses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--bg-danger)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 10h22" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No expenses yet</p>
              <p className="text-xs mb-4" style={{ color: "var(--text-faint)" }}>Track your operating costs to see net profit</p>
              {isOwner && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: "var(--brand-primary)" }}
                >
                  Add first expense
                </button>
              )}
            </div>
          ) : (
            <div>
              {expenses.map((expense, i) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: i < expenses.length - 1 ? `1px solid var(--border-subtle)` : "none" }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[expense.category] ?? "#9CA3AF"}20`,
                        color: CATEGORY_COLORS[expense.category] ?? "var(--text-faint)",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{expense.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[expense.category] ?? "#9CA3AF"}20`,
                            color: CATEGORY_COLORS[expense.category] ?? "var(--text-faint)",
                          }}
                        >
                          {expense.category}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                          {new Date(expense.expense_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      {expense.notes && <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{expense.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-sm font-bold" style={{ color: "var(--color-danger)" }}>
                      −{fmt(Number(expense.amount))}
                    </span>
                    {isOwner && (
                      <>
                        <button
                          onClick={() => openEditModal(expense)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                          style={{ color: "var(--text-muted)" }}
                          title="Edit expense"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(expense)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                          style={{ color: "var(--color-loss)" }}
                          title="Delete expense"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add expense modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Add expense</h2>
              <button onClick={() => { setShowForm(false); setError(null); }} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: "var(--text-faint)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Monthly rent"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: form.title ? "var(--brand-mid)" : "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Amount (₦) *</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: form.amount ? "var(--brand-mid)" : "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Date</label>
                <input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Notes (optional)</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional details"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}/>
              </div>
              {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--bg-danger)", color: "var(--color-loss)" }}>{error}</p>}
              <button onClick={handleSubmit} disabled={loading || !form.title || !form.amount}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--brand-primary)" }}>
                {loading ? "Saving…" : "Save expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit expense modal */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Edit expense</h2>
              <button onClick={() => { setShowEditForm(null); setError(null); }} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: "var(--text-faint)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Title *</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: editForm.title ? "var(--brand-mid)" : "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Category</label>
                <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Amount (₦) *</label>
                <input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: editForm.amount ? "var(--brand-mid)" : "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Date</label>
                <input type="date" value={editForm.expense_date} onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Notes (optional)</label>
                <input type="text" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}/>
              </div>
              {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--bg-danger)", color: "var(--color-loss)" }}>{error}</p>}
              <button onClick={handleEditSubmit} disabled={loading || !editForm.title || !editForm.amount}
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
                <h2 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>Delete this expense?</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  <span className="font-semibold">{showDeleteConfirm.title}</span> — {fmt(Number(showDeleteConfirm.amount))}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 h-11 rounded-xl border text-sm font-semibold"
                  style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}>
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-danger)" }}>
                  {deleteLoading ? "Deleting…" : "Delete"}
                </button>
              </div>
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
          <a key={item.href} href={item.href} className="flex flex-col items-center justify-center py-3 gap-1"
            style={{ color: "var(--text-faint)" }}>
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}