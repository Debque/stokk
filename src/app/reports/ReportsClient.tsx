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

  const monthName = new Date().toLocaleString("en-NG", { month: "long", year: "numeric" });
  const maxWeekly = Math.max(...weeklyRevenue, 1);
  const maxProductRevenue = productPerformance[0]?.revenue ?? 1;
  const maxExpense = Math.max(...Object.values(expenseCategoryMap), 1);

  function getStatusStyle(status: string) {
    switch (status) {
      case "in_stock": return { bg: "#DCFCE7", color: "#14532D", label: "In stock" };
      case "sold": return { bg: "#E1F5EE", color: "#0F6E56", label: "Sold" };
      case "faulty": return { bg: "#FEE2E2", color: "#7F1D1D", label: "Faulty" };
      case "returned": return { bg: "#FFF7ED", color: "#9A3412", label: "Returned" };
      default: return { bg: "#F3F4F6", color: "#6B7280", label: status };
    }
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "sales", label: "Sales" },
    { id: "imei", label: "IMEI report" },
    { id: "expenses", label: "Expenses" },
  ] as const;

  return (
    <div>
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 lg:px-6 py-4">
          <div className="flex items-center gap-3">
            <MobileMenuButton />
            <div>
            <h1 className="text-lg font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-xs text-gray-500 mt-0.5">{profile.store_name} · {monthName}</p>
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
                backgroundColor: activeTab === tab.id ? "#0D3B2E" : "transparent",
                color: activeTab === tab.id ? "#fff" : "#6B7280",
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
                { label: "Gross revenue", value: fmtShort(grossRevenue), change: revenueChange, color: "#1D9E75" },
                { label: "Gross profit", value: fmtShort(grossProfit), change: profitChange, sub: `Margin: ${grossRevenue > 0 ? Math.round((grossProfit / grossRevenue) * 100) : 0}%`, color: "#16A34A" },
                { label: "Total expenses", value: fmtShort(totalExpenses), sub: `${monthlyExpenses.length} categories`, color: "#EF4444" },
                { label: "Net profit", value: fmtShort(netProfit), sub: netProfit >= 0 ? "Profitable" : "Loss", color: netProfit >= 0 ? "#0D3B2E" : "#DC2626" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="bg-white rounded-2xl p-4 border border-gray-100"
                  style={{ borderLeft: `4px solid ${card.color}` }}
                >
                  <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                  <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
                  {card.change !== undefined && card.change !== null ? (
                    <p className="text-xs mt-1 font-medium" style={{ color: card.change >= 0 ? "#16A34A" : "#DC2626" }}>
                      {card.change >= 0 ? "+" : ""}{card.change}% vs last month
                    </p>
                  ) : card.sub ? (
                    <p className="text-xs mt-1 text-gray-400">{card.sub}</p>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Weekly revenue chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue by week — {monthName}</h2>
              {weeklyRevenue.every((v) => v === 0) ? (
                <div className="h-32 flex items-center justify-center">
                  <p className="text-sm text-gray-400">No sales recorded yet</p>
                </div>
              ) : (
                <div className="flex items-end gap-4 h-32">
                  {weeklyRevenue.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">{val > 0 ? fmtShort(val) : ""}</span>
                      <div
                        className="w-full rounded-t-xl transition-all"
                        style={{
                          height: `${Math.max(Math.round((val / maxWeekly) * 80), val > 0 ? 8 : 0)}px`,
                          backgroundColor: val === Math.max(...weeklyRevenue) ? "#1D9E75" : "#E1F5EE",
                        }}
                      />
                      <span className="text-xs text-gray-400">Week {i + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* P&L summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">{monthName} P&L</h2>
              <div className="space-y-0">
                {[
                  { label: "Gross revenue", value: fmt(grossRevenue), color: "#111827" },
                  { label: "Cost of goods", value: `−${fmt(grossRevenue - grossProfit)}`, color: "#DC2626" },
                  { label: "Gross profit", value: fmt(grossProfit), color: "#16A34A" },
                  { label: "Operating expenses", value: `−${fmt(totalExpenses)}`, color: "#DC2626" },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <span className="text-sm text-gray-500">{row.label}</span>
                    <span className="text-sm font-semibold" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div
                className="flex items-center justify-between mt-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: netProfit >= 0 ? "#E1F5EE" : "#FEE2E2" }}
              >
                <span className="text-sm font-bold" style={{ color: "#0D3B2E" }}>Net profit</span>
                <span className="text-xl font-bold" style={{ color: netProfit >= 0 ? "#0D3B2E" : "#DC2626" }}>
                  {netProfit < 0 ? "−" : ""}{fmt(Math.abs(netProfit))}
                </span>
              </div>
            </div>

            {/* Top products */}
            {productPerformance.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Product performance — top earners</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "#F9FAFB" }}>
                        {["Product", "Brand", "Units sold", "Revenue", "Profit", "Margin"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {productPerformance.map((p, i) => (
                        <tr key={i} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                          <td className="px-4 py-3 font-semibold text-gray-900">{p.name}</td>
                          <td className="px-4 py-3 text-gray-500">{p.brand}</td>
                          <td className="px-4 py-3 text-gray-700">{p.units}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{fmt(p.revenue)}</td>
                          <td className="px-4 py-3 font-bold" style={{ color: "#16A34A" }}>{fmt(p.profit)}</td>
                          <td className="px-4 py-3 text-gray-500">
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
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">All sales — {monthName}</h2>
            </div>
            {productPerformance.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-gray-400">No sales recorded this month</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#F9FAFB" }}>
                      {["Product", "Brand", "Units", "Revenue", "Profit", "Margin"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productPerformance.map((p, i) => (
                      <tr key={i} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.round((p.revenue / maxProductRevenue) * 100)}%`,
                                  backgroundColor: "#1D9E75",
                                }}
                              />
                            </div>
                            <span className="font-semibold text-gray-900">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{p.brand}</td>
                        <td className="px-4 py-3 text-gray-700">{p.units}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{fmt(p.revenue)}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: "#16A34A" }}>{fmt(p.profit)}</td>
                        <td className="px-4 py-3 text-gray-500">
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
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">IMEI report — all units</h2>
            </div>
            {imeiReport.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-gray-400">No serialized units registered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#F9FAFB" }}>
                      {["IMEI", "Product", "Variant", "Cost", "Sold for", "Profit", "Status", "Date"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {imeiReport.map((item, i) => {
                      const style = getStatusStyle(item.status);
                      return (
                        <tr key={item.id} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: "#0F6E56" }}>{item.imei}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900 text-xs">{item.product_name}</p>
                            <p className="text-gray-400 text-xs">{item.brand_name}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{item.variant ?? "—"}</td>
                          <td className="px-4 py-3 text-xs font-medium text-gray-700">{fmt(Number(item.cost_price))}</td>
                          <td className="px-4 py-3 text-xs font-medium text-gray-700">
                            {item.sale ? fmt(Number(item.sale.selling_price)) : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold" style={{ color: item.sale ? "#16A34A" : "#9CA3AF" }}>
                            {item.sale ? fmt(Number(item.sale.profit)) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: style.bg, color: style.color }}
                            >
                              {style.label}
                            </span>
                            {item.condition_notes && (
                              <p className="text-xs mt-0.5" style={{ color: "#9A3412" }}>{item.condition_notes}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
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
            {/* Category breakdown */}
            {Object.keys(expenseCategoryMap).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Expense breakdown</h2>
                <div className="space-y-3">
                  {Object.entries(expenseCategoryMap)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amount]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: CATEGORY_COLORS[cat] ?? "#9CA3AF" }}
                          />
                          <span className="text-sm text-gray-700">{cat}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden mx-3">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.round((amount / maxExpense) * 100)}%`,
                                backgroundColor: CATEGORY_COLORS[cat] ?? "#9CA3AF",
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 ml-3">{fmt(amount)}</span>
                      </div>
                    ))}
                  <div
                    className="flex items-center justify-between pt-3 mt-2"
                    style={{ borderTop: "2px solid #F3F4F6" }}
                  >
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <span className="text-sm font-bold" style={{ color: "#EF4444" }}>{fmt(totalExpenses)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Expense list */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">All expenses — {monthName}</h2>
              </div>
              {monthlyExpenses.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-gray-400">No expenses recorded this month</p>
                </div>
              ) : (
                monthlyExpenses.map((expense, i) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: i < monthlyExpenses.length - 1 ? "1px solid #F3F4F6" : "none" }}
                  >
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
                          {new Date(expense.expense_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold" style={{ color: "#EF4444" }}>
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
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 grid grid-cols-5 z-20"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
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
            style={{ color: item.active ? "#0D3B2E" : "#9CA3AF" }}
          >
            <span className="text-xs font-medium">{item.label}</span>
            {item.active && (
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "#0D3B2E" }} />
            )}
          </a>
        ))}
      </nav>
    </div>
  );
}