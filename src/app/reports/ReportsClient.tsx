"use client";

import MobileMenuButton from "@/components/MobileMenuButton";
import React, { useState } from "react";

interface ProductPerformance {
  name: string;
  brand: string;
  units: number;
  revenue: number;
  profit: number;
}

interface ImeiItem {
  id: string;
  imei: string;
  variant: string | null;
  cost_price: number;
  status: string;
  condition_notes: string | null;
  purchased_at: string;
  sold_at: string | null;
  product_name: string;
  brand_name: string;
  sale: { selling_price: number; profit: number } | null;
}

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
}

interface Props {
  grossRevenue: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  revenueChange: number | null;
  profitChange: number | null;
  productPerformance: ProductPerformance[];
  weeklyRevenue: number[];
  imeiReport: ImeiItem[];
  monthlyExpenses: Expense[];
  expenseCategoryMap: Record<string, number>;
  profile: { store_name: string; full_name: string; role: string };
}

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

export default function ReportsClient({
  grossRevenue,
  grossProfit,
  totalExpenses,
  netProfit,
  revenueChange,
  profitChange,
  productPerformance,
  weeklyRevenue,
  imeiReport,
  monthlyExpenses,
  expenseCategoryMap,
  profile,
}: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "imei" | "expenses">("overview");

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
  const fmtShort = (n: number) =>
    n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `₦${(n / 1_000).toFixed(0)}K`
    : `₦${n}`;

  function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportSalesCSV() {
    exportCSV(
      `stokk-sales-${monthName.replace(" ", "-")}.csv`,
      ["Product", "Brand", "Units Sold", "Revenue (₦)", "Profit (₦)", "Margin (%)"],
      productPerformance.map((p) => [
        p.name, p.brand, p.units, p.revenue, p.profit,
        p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0,
      ])
    );
  }

  function exportExpensesCSV() {
    exportCSV(
      `stokk-expenses-${monthName.replace(" ", "-")}.csv`,
      ["Title", "Category", "Amount (₦)", "Date"],
      monthlyExpenses.map((e) => [
        e.title, e.category, e.amount,
        new Date(e.expense_date).toLocaleDateString("en-NG"),
      ])
    );
  }

  function exportIMEICSV() {
    exportCSV(
      `stokk-imei-report.csv`,
      ["IMEI", "Product", "Brand", "Variant", "Cost (₦)", "Sold For (₦)", "Profit (₦)", "Status", "Purchase Date"],
      imeiReport.map((item) => [
        item.imei, item.product_name, item.brand_name, item.variant ?? "",
        item.cost_price, item.sale?.selling_price ?? "", item.sale?.profit ?? "",
        item.status, new Date(item.purchased_at).toLocaleDateString("en-NG"),
      ])
    );
  }

  const monthName = new Date().toLocaleString("en-NG", { month: "long", year: "numeric" });
  const maxWeekly = Math.max(...weeklyRevenue, 1);
  const maxProductRevenue = productPerformance[0]?.revenue ?? 1;
  const maxExpense = Math.max(...Object.values(expenseCategoryMap), 1);

  function getStatusStyle(status: string) {
    switch (status) {
      case "in_stock": return { bg: "var(--bg-success)", color: "var(--color-success-dark)", label: "In stock" };
      case "sold": return { bg: "var(--bg-green)", color: "var(--brand-dark)", label: "Sold" };
      case "faulty": return { bg: "var(--bg-danger)", color: "var(--color-loss)", label: "Faulty" };
      case "returned": return { bg: "var(--bg-warning)", color: "var(--color-warning-dark)", label: "Returned" };
      default: return { bg: "var(--border-subtle)", color: "var(--text-muted)", label: status };
    }
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "sales", label: "Sales" },
    { id: "imei", label: "IMEI report" },
    { id: "expenses", label: "Expenses" },
  ] as const;

  return (
    <div style={{ backgroundColor: "var(--bg-subtle)", minHeight: "100vh" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center justify-between px-4 lg:px-6 py-4">
          <div className="flex items-center gap-3">
            <MobileMenuButton />
            <div>
              <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Reports & Analytics</h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{profile.store_name} · {monthName}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 lg:px-6 pb-3 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition"
              style={{
                backgroundColor: activeTab === tab.id ? "var(--brand-primary)" : "transparent",
                color: activeTab === tab.id ? "#fff" : "var(--text-muted)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-5">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Gross revenue", value: fmtShort(grossRevenue), change: revenueChange, color: "var(--brand-mid)" },
                { label: "Gross profit", value: fmtShort(grossProfit), change: profitChange, sub: `Margin: ${grossRevenue > 0 ? Math.round((grossProfit / grossRevenue) * 100) : 0}%`, color: "var(--color-profit)" },
                { label: "Total expenses", value: fmtShort(totalExpenses), sub: `${monthlyExpenses.length} categories`, color: "var(--color-danger)" },
                { label: "Net profit", value: fmtShort(netProfit), sub: netProfit >= 0 ? "Profitable" : "Loss", color: netProfit >= 0 ? "var(--brand-primary)" : "var(--color-loss)" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl p-4 border"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border-subtle)",
                    borderLeft: `4px solid ${card.color}`,
                  }}
                >
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{card.label}</p>
                  <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
                  {card.change !== undefined && card.change !== null ? (
                    <p className="text-xs mt-1 font-medium" style={{ color: card.change >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                      {card.change >= 0 ? "+" : ""}{card.change}% vs last month
                    </p>
                  ) : card.sub ? (
                    <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{card.sub}</p>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Weekly revenue chart */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Revenue by week — {monthName}</h2>
              {weeklyRevenue.every((v) => v === 0) ? (
                <div className="h-32 flex items-center justify-center">
                  <p className="text-sm" style={{ color: "var(--text-faint)" }}>No sales recorded yet</p>
                </div>
              ) : (
                <div className="flex items-end gap-4 h-32">
                  {weeklyRevenue.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{val > 0 ? fmtShort(val) : ""}</span>
                      <div
                        className="w-full rounded-t-xl transition-all"
                        style={{
                          height: `${Math.max(Math.round((val / maxWeekly) * 80), val > 0 ? 8 : 0)}px`,
                          backgroundColor: val === Math.max(...weeklyRevenue) ? "var(--brand-mid)" : "var(--bg-green)",
                        }}
                      />
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>Week {i + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* P&L summary */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{monthName} P&L</h2>
              <div className="space-y-0">
                {[
                  { label: "Gross revenue", value: fmt(grossRevenue), color: "var(--text-primary)" },
                  { label: "Cost of goods", value: `−${fmt(grossRevenue - grossProfit)}`, color: "var(--color-loss)" },
                  { label: "Gross profit", value: fmt(grossProfit), color: "var(--color-profit)" },
                  { label: "Operating expenses", value: `−${fmt(totalExpenses)}`, color: "var(--color-loss)" },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3"
                    style={{ borderBottom: `1px solid var(--border-subtle)` }}
                  >
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>{row.label}</span>
                    <span className="text-sm font-semibold" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div
                className="flex items-center justify-between mt-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: netProfit >= 0 ? "var(--bg-green)" : "var(--bg-danger)" }}
              >
                <span className="text-sm font-bold" style={{ color: "var(--brand-primary)" }}>Net profit</span>
                <span className="text-xl font-bold" style={{ color: netProfit >= 0 ? "var(--brand-primary)" : "var(--color-loss)" }}>
                  {netProfit < 0 ? "−" : ""}{fmt(Math.abs(netProfit))}
                </span>
              </div>
            </div>

            {/* Top products */}
            {productPerformance.length > 0 && (
              <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Product performance — top earners</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "var(--bg-subtle)" }}>
                        {["Product", "Brand", "Units sold", "Revenue", "Profit", "Margin"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {productPerformance.map((p, i) => (
                        <tr key={i} style={{ borderTop: i > 0 ? `1px solid var(--border-subtle)` : "none" }}>
                          <td className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>{p.name}</td>
                          <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>{p.brand}</td>
                          <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{p.units}</td>
                          <td className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(p.revenue)}</td>
                          <td className="px-4 py-3 font-bold" style={{ color: "var(--color-profit)" }}>{fmt(p.profit)}</td>
                          <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                            {p.revenue > 0 ? `${Math.round((p.profit / p.revenue) * 100)}%` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── SALES TAB ── */}
        {activeTab === "sales" && (
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>All sales — {monthName}</h2>
              <button
                onClick={exportSalesCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: "var(--bg-green)", color: "var(--brand-dark)" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Export CSV
              </button>
            </div>
            {productPerformance.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm" style={{ color: "var(--text-faint)" }}>No sales recorded this month</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "var(--bg-subtle)" }}>
                      {["Product", "Brand", "Units", "Revenue", "Profit", "Margin"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productPerformance.map((p, i) => (
                      <tr key={i} style={{ borderTop: i > 0 ? `1px solid var(--border-subtle)` : "none" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-subtle)" }}>
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.round((p.revenue / maxProductRevenue) * 100)}%`, backgroundColor: "var(--brand-mid)" }}
                              />
                            </div>
                            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>{p.brand}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{p.units}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(p.revenue)}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: "var(--color-profit)" }}>{fmt(p.profit)}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                          {p.revenue > 0 ? `${Math.round((p.profit / p.revenue) * 100)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── IMEI TAB ── */}
        {activeTab === "imei" && (
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>IMEI report — all units</h2>
              <button
                onClick={exportIMEICSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: "var(--bg-green)", color: "var(--brand-dark)" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Export CSV
              </button>
            </div>
            {imeiReport.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm" style={{ color: "var(--text-faint)" }}>No serialized units registered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "var(--bg-subtle)" }}>
                      {["IMEI", "Product", "Variant", "Cost", "Sold for", "Profit", "Status", "Date"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {imeiReport.map((item, i) => {
                      const style = getStatusStyle(item.status);
                      return (
                        <tr key={item.id} style={{ borderTop: i > 0 ? `1px solid var(--border-subtle)` : "none" }}>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--brand-dark)" }}>{item.imei}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-xs" style={{ color: "var(--text-primary)" }}>{item.product_name}</p>
                            <p className="text-xs" style={{ color: "var(--text-faint)" }}>{item.brand_name}</p>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{item.variant ?? "—"}</td>
                          <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{fmt(Number(item.cost_price))}</td>
                          <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                            {item.sale ? fmt(Number(item.sale.selling_price)) : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold" style={{ color: item.sale ? "var(--color-profit)" : "var(--text-faint)" }}>
                            {item.sale ? fmt(Number(item.sale.profit)) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: style.bg, color: style.color }}>
                              {style.label}
                            </span>
                            {item.condition_notes && (
                              <p className="text-xs mt-0.5" style={{ color: "var(--color-warning-dark)" }}>{item.condition_notes}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-faint)" }}>
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
        )}

        {/* ── EXPENSES TAB ── */}
        {activeTab === "expenses" && (
          <>
            {Object.keys(expenseCategoryMap).length > 0 && (
              <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Expense breakdown</h2>
                <div className="space-y-3">
                  {Object.entries(expenseCategoryMap)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amount]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] ?? "var(--text-faint)" }}/>
                          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{cat}</span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden mx-3" style={{ backgroundColor: "var(--border-subtle)" }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.round((amount / maxExpense) * 100)}%`, backgroundColor: CATEGORY_COLORS[cat] ?? "var(--text-faint)" }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-semibold ml-3" style={{ color: "var(--text-primary)" }}>{fmt(amount)}</span>
                      </div>
                    ))}
                  <div className="flex items-center justify-between pt-3 mt-2" style={{ borderTop: `2px solid var(--border-subtle)` }}>
                    <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Total</span>
                    <span className="text-sm font-bold" style={{ color: "var(--color-danger)" }}>{fmt(totalExpenses)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>All expenses — {monthName}</h2>
                <button
                  onClick={exportExpensesCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ backgroundColor: "var(--bg-green)", color: "var(--brand-dark)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Export CSV
                </button>
              </div>
              {monthlyExpenses.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm" style={{ color: "var(--text-faint)" }}>No expenses recorded this month</p>
                </div>
              ) : (
                monthlyExpenses.map((expense, i) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: i < monthlyExpenses.length - 1 ? `1px solid var(--border-subtle)` : "none" }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{expense.title}</p>
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
                    </div>
                    <span className="text-sm font-bold" style={{ color: "var(--color-danger)" }}>
                      −{fmt(Number(expense.amount))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 border-t grid grid-cols-5 z-20"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Sales", href: "/sales" },
          { label: "Reports", href: "/reports", active: true },
          { label: "More", href: "/settings" },
        ].map((item) => (
          
           <a key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center py-3 gap-1"
            style={{ color: item.active ? "var(--brand-primary)" : "var(--text-faint)" }}
          >
            <span className="text-xs font-medium">{item.label}</span>
            {item.active && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "var(--brand-primary)" }} />}
          </a>
        ))}
      </nav>
    </div>
  );
}