import React from "react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  // Placeholder data — will be replaced with real Supabase queries in Phase 3
  const stats = {
    monthlyRevenue: "₦4,800,000",
    monthlyProfit: "₦1,200,000",
    todaySales: "₦124,500",
    todayTransactions: 23,
    lowStockCount: 4,
    revenueChange: "+12%",
    profitChange: "+8%",
  };

  const recentSales = [
    { product: "iPhone 15 Pro", type: "IMEI", time: "10:42am", amount: "₦980,000", profit: "+₦85,000" },
    { product: "Type-C Charger ×3", type: "Non-serial", time: "09:15am", amount: "₦10,500", profit: "+₦3,900" },
    { product: "Tecno Camon 30", type: "IMEI", time: "08:55am", amount: "₦340,000", profit: "+₦28,000" },
    { product: "Galaxy S24", type: "IMEI", time: "08:30am", amount: "₦780,000", profit: "+₦62,000" },
  ];

  const lowStockItems = [
    { name: "Type-C Charger 65W", left: 3, min: 10 },
    { name: "Screen Protector 13", left: 2, min: 15 },
    { name: "Power Bank 20K", left: 4, min: 8 },
    { name: "Lightning Cable 2M", left: 5, min: 10 },
  ];

  const brands = [
    { name: "Tecno", initial: "T", units: 14, color: "#E1F5EE", textColor: "#0F6E56", barWidth: "100%" },
    { name: "Apple", initial: "A", units: 11, color: "#DBEAFE", textColor: "#1E3A8A", barWidth: "79%" },
    { name: "Samsung", initial: "S", units: 8, color: "#FEE2E2", textColor: "#7F1D1D", barWidth: "57%" },
    { name: "Infinix", initial: "I", units: 5, color: "#FFF7ED", textColor: "#9A3412", barWidth: "36%" },
    { name: "Xiaomi", initial: "X", units: 3, color: "#F3E8FF", textColor: "#6B21A8", barWidth: "21%" },
  ];

  const topProducts = [
    { name: "iPhone 15 Pro", sold: 28, barWidth: "100%" },
    { name: "Type-C Charger", sold: 22, barWidth: "79%" },
    { name: "Galaxy S24", sold: 18, barWidth: "64%" },
    { name: "AirPods Pro", sold: 14, barWidth: "50%" },
    { name: "Screen Protector", sold: 11, barWidth: "39%" },
  ];

  const chartBars = [42,68,55,80,63,90,74,85,60,95,72,88,66,78,55,92,70,84,61,98,75,89,65,82,70,94,80,86,72,100];

  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">

      {/* Sidebar */}
      <Sidebar
        storeName={profile.store_name}
        fullName={profile.full_name}
        role={profile.role}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">

        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">{today} · {profile.store_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "#FFF7ED", color: "#9A3412" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              {stats.lowStockCount} alerts
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#1D9E75" }}>
              {profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Monthly revenue", value: stats.monthlyRevenue, change: stats.revenueChange, changeLabel: "vs last month", positive: true },
              { label: "Monthly profit", value: stats.monthlyProfit, change: stats.profitChange, changeLabel: "vs last month", positive: true },
              { label: "Today's sales", value: stats.todaySales, change: `${stats.todayTransactions} transactions`, changeLabel: "", positive: true },
              { label: "Low stock items", value: String(stats.lowStockCount), change: "Needs restocking", changeLabel: "", positive: false, warn: true },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl p-4 border"
                style={{
                  borderColor: stat.warn ? "#FED7AA" : "#F3F4F6",
                  borderLeft: `4px solid ${stat.warn ? "#F97316" : "#1D9E75"}`,
                }}
              >
                <p className="text-xs font-medium mb-2" style={{ color: stat.warn ? "#9A3412" : "#6B7280" }}>
                  {stat.label}
                </p>
                <p className="text-2xl font-bold" style={{ color: stat.warn ? "#F97316" : "#111827" }}>
                  {stat.value}
                </p>
                <p className="text-xs mt-1.5 font-medium" style={{ color: stat.warn ? "#F97316" : "#16A34A" }}>
                  {stat.change} {stat.changeLabel}
                </p>
              </div>
            ))}
          </div>

          {/* Revenue chart + Recent sales */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Revenue chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Revenue — last 30 days</h2>
                <button className="text-xs font-medium" style={{ color: "#1D9E75" }}>View all</button>
              </div>
              <div className="flex items-end gap-1 h-28">
                {chartBars.map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${val}%`,
                      backgroundColor: val > 90 ? "#1D9E75" : val > 70 ? "#5DCAA5" : "#E1F5EE",
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {["1", "", "", "", "5", "", "", "", "", "10", "", "", "", "", "15", "", "", "", "", "20", "", "", "", "", "25", "", "", "", "", "30"].map((label, i) => (
                  <div key={i} className="flex-1 text-center text-xs text-gray-300">{label}</div>
                ))}
              </div>
            </div>

            {/* Recent sales */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Recent sales</h2>
                <button className="text-xs font-medium" style={{ color: "#1D9E75" }}>View all</button>
              </div>
              <div className="space-y-0">
                {recentSales.map((sale, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3"
                    style={{ borderBottom: i < recentSales.length - 1 ? "1px solid #F3F4F6" : "none" }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{sale.product}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{sale.type} · {sale.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{sale.amount}</p>
                      <p className="text-xs font-medium mt-0.5" style={{ color: "#16A34A" }}>{sale.profit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Low stock + Brand summary + P&L */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Low stock alerts */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Low stock alerts</h2>
                <button className="text-xs font-medium" style={{ color: "#F97316" }}>Restock all</button>
              </div>
              <div className="space-y-2">
                {lowStockItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                    style={{ backgroundColor: "#FFF7ED", borderLeft: "3px solid #F97316" }}
                  >
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "#9A3412" }}>{item.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#C2410C" }}>{item.left} left · min: {item.min}</p>
                    </div>
                    <button className="text-xs font-semibold" style={{ color: "#F97316" }}>+ Stock</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock by brand */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Stock by brand</h2>
                <button className="text-xs font-medium" style={{ color: "#1D9E75" }}>View all</button>
              </div>
              <div className="space-y-0">
                {brands.map((brand, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderBottom: i < brands.length - 1 ? "1px solid #F3F4F6" : "none" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: brand.color, color: brand.textColor }}
                    >
                      {brand.initial}
                    </div>
                    <span className="text-sm font-medium text-gray-800 flex-1">{brand.name}</span>
                    <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: brand.barWidth, backgroundColor: "#1D9E75" }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-right min-w-14" style={{ color: "#0F6E56" }}>
                      {brand.units} units
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* P&L Summary */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  {new Date().toLocaleString("en-NG", { month: "long" })} P&L
                </h2>
              </div>
              <div className="space-y-0">
                {[
                  { label: "Gross revenue", value: "₦4,800,000", color: "#111827" },
                  { label: "Cost of goods", value: "−₦3,600,000", color: "#DC2626" },
                  { label: "Gross profit", value: "₦1,200,000", color: "#16A34A" },
                  { label: "Expenses", value: "−₦320,000", color: "#DC2626" },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <span className="text-sm text-gray-500">{row.label}</span>
                    <span className="text-sm font-semibold" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
              {/* Net profit highlight */}
              <div
                className="flex items-center justify-between mt-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: "#E1F5EE" }}
              >
                <span className="text-sm font-bold" style={{ color: "#0D3B2E" }}>Net profit</span>
                <span className="text-lg font-bold" style={{ color: "#0D3B2E" }}>₦880,000</span>
              </div>
            </div>
          </div>

          {/* Top products */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Top selling this month</h2>
            </div>
            <div className="space-y-0">
              {topProducts.map((product, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-3"
                  style={{ borderBottom: i < topProducts.length - 1 ? "1px solid #F3F4F6" : "none" }}
                >
                  <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                  <span className="text-sm font-medium text-gray-800 flex-1">{product.name}</span>
                  <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: product.barWidth, backgroundColor: "#1D9E75" }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 min-w-12 text-right">{product.sold} sold</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 grid grid-cols-5 z-20"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {[
          { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
          { icon: "inventory", label: "Inventory", href: "/inventory" },
          { icon: "sales", label: "Sales", href: "/sales" },
          { icon: "reports", label: "Reports", href: "/reports" },
          { icon: "settings", label: "More", href: "/settings" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center py-3 gap-1"
            style={{ color: item.href === "/dashboard" ? "#0D3B2E" : "#9CA3AF" }}
          >
            <span style={{ color: item.href === "/dashboard" ? "#0D3B2E" : "#9CA3AF" }}>
              <NavIcon icon={item.icon} />
            </span>
            <span className="text-xs font-medium">{item.label}</span>
            {item.href === "/dashboard" && (
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "#0D3B2E" }} />
            )}
          </a>
        ))}
      </nav>
    </div>
  );
}

// Inline NavIcon for mobile nav (server component can't import client component icons)
function NavIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactElement> = {
    dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.3"/></svg>,
    inventory: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    sales: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    reports: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  };
  return icons[icon] || null;
}