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
}: Props) {
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    category: "Rent",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

  const monthName = new Date().toLocaleString("en-NG", { month: "long", year: "numeric" });

  async function handleSubmit() {
    if (!form.title || !form.amount) {
      setError("Title and amount are required.");
      return;
    }
    if (Number(form.amount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

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

      setForm({
        title: "",
        category: "Rent",
        amount: "",
        expense_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setShowForm(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const maxCategory = Math.max(...Object.values(categoryTotals), 1);

  return (
    <div>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <div>
          <h1 className="text-lg font-bold text-gray-900">Expenses</h1>
          <p className="text-xs text-gray-500 mt-0.5">{monthName}</p>
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
          Add expense
        </button>
      </div>

      <div className="p-4 lg:p-6 space-y-5">

        {/* Total card */}
        <div
          className="bg-white rounded-2xl p-5 border"
          style={{ borderLeft: "4px solid #EF4444", borderColor: "#FEE2E2" }}
        >
          <p className="text-xs font-medium text-gray-500 mb-1">Total expenses — {monthName}</p>
          <p className="text-3xl font-bold" style={{ color: "#EF4444" }}>
            {fmt(totalThisMonth)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""} recorded
          </p>
        </div>

        {/* Category breakdown */}
        {Object.keys(categoryTotals).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">By category</h2>
            <div className="space-y-3">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amount]) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[cat] ?? "#9CA3AF" }}
                        />
                        <span className="text-sm font-medium text-gray-700">{cat}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{fmt(amount)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round((amount / maxCategory) * 100)}%`,
                          backgroundColor: CATEGORY_COLORS[cat] ?? "#9CA3AF",
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Expenses list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">All expenses this month</h2>
          </div>

          {expenses.length === 0 ? (
            <div className="p-12 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#FEE2E2" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 10h22" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">No expenses yet</p>
              <p className="text-xs text-gray-400 mb-4">Track your operating costs to see net profit</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "#0D3B2E" }}
              >
                Add first expense
              </button>
            </div>
          ) : (
            <div>
              {expenses.map((expense, i) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: i < expenses.length - 1 ? "1px solid #F3F4F6" : "none" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[expense.category] ?? "#9CA3AF"}20`,
                        color: CATEGORY_COLORS[expense.category] ?? "#9CA3AF",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{expense.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[expense.category] ?? "#9CA3AF"}15`,
                            color: CATEGORY_COLORS[expense.category] ?? "#9CA3AF",
                          }}
                        >
                          {expense.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(expense.expense_date).toLocaleDateString("en-NG", {
                            day: "numeric", month: "short",
                          })}
                        </span>
                      </div>
                      {expense.notes && (
                        <p className="text-xs text-gray-400 mt-0.5">{expense.notes}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#EF4444" }}>
                    −{fmt(Number(expense.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add expense modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Add expense</h2>
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
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Monthly rent"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: form.title ? "#1D9E75" : "#E5E7EB" }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none bg-white"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Amount (₦) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: form.amount ? "#1D9E75" : "#E5E7EB" }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#E5E7EB" }}
                />
              </div>

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
                <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !form.title || !form.amount}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#0D3B2E" }}
              >
                {loading ? "Saving…" : "Save expense"}
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