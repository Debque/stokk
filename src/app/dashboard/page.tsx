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

  // ── Date helpers ────────────────────────────────────────────────────────────
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString();
  const startOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  ).toISOString();
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
  ).toISOString();

  // ── Real Supabase queries ────────────────────────────────────────────────────

  // Monthly sales data
  const { data: monthlySales } = await supabase
    .from("sales")
    .select(
      "selling_price, cost_price_at_sale, profit, sold_at, product_name, stock_item_id, quantity_sold",
    )
    .gte("sold_at", startOfMonth);

  // Last month sales for comparison
  const { data: lastMonthSales } = await supabase
    .from("sales")
    .select("selling_price, profit")
    .gte("sold_at", startOfLastMonth)
    .lte("sold_at", endOfLastMonth);

  // Today's sales
  const { data: todaySales } = await supabase
    .from("sales")
    .select("selling_price, profit, product_name, stock_item_id, sold_at")
    .gte("sold_at", startOfToday)
    .order("sold_at", { ascending: false });

  // Recent sales (last 5)
  const { data: recentSalesData } = await supabase
    .from("sales")
    .select(
      "product_name, brand_name, selling_price, profit, sold_at, stock_item_id, quantity_sold",
    )
    .order("sold_at", { ascending: false })
    .limit(5);

  // Monthly expenses
  const { data: monthlyExpenses } = await supabase
    .from("expenses")
    .select("amount")
    .gte("expense_date", startOfMonth.split("T")[0]);

  // Low stock products
  const { data: allProducts } = await supabase
    .from("products")
    .select("id, name, quantity, minimum_stock, is_serialized, brand_id")
    .is("deleted_at", null);

  // Serialized stock counts per product
  const { data: serializedStock } = await supabase
    .from("stock_items")
    .select("product_id")
    .eq("status", "in_stock");

  // Brands with product counts
  const { data: brandsData } = await supabase.from("brands").select("id, name");

  // Top selling products this month
  const { data: topProductsData } = await supabase
    .from("sales")
    .select("product_name, quantity_sold")
    .gte("sold_at", startOfMonth);

  // Revenue per day this month for chart
  const { data: chartSalesData } = await supabase
    .from("sales")
    .select("selling_price, sold_at")
    .gte("sold_at", startOfMonth);

  // ── Calculations ─────────────────────────────────────────────────────────────

  const monthlyRevenue =
    monthlySales?.reduce((sum, s) => sum + Number(s.selling_price), 0) ?? 0;
  const monthlyProfit =
    monthlySales?.reduce((sum, s) => sum + Number(s.profit), 0) ?? 0;
  const lastMonthRevenue =
    lastMonthSales?.reduce((sum, s) => sum + Number(s.selling_price), 0) ?? 0;
  const lastMonthProfit =
    lastMonthSales?.reduce((sum, s) => sum + Number(s.profit), 0) ?? 0;
  const totalExpenses =
    monthlyExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
  const netProfit = monthlyProfit - totalExpenses;
  const todayRevenue =
    todaySales?.reduce((sum, s) => sum + Number(s.selling_price), 0) ?? 0;
  const todayCount = todaySales?.length ?? 0;

  // Revenue change vs last month
  const revenueChange =
    lastMonthRevenue > 0
      ? `${monthlyRevenue >= lastMonthRevenue ? "+" : ""}${Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)}%`
      : monthlySales && monthlySales.length > 0
        ? "New"
        : "—";

  const profitChange =
    lastMonthProfit > 0
      ? `${monthlyProfit >= lastMonthProfit ? "+" : ""}${Math.round(((monthlyProfit - lastMonthProfit) / lastMonthProfit) * 100)}%`
      : monthlySales && monthlySales.length > 0
        ? "New"
        : "—";

  // Serialized stock count per product
  const serializedCountMap: Record<string, number> = {};
  serializedStock?.forEach((item) => {
    serializedCountMap[item.product_id] =
      (serializedCountMap[item.product_id] ?? 0) + 1;
  });

  // Low stock items
  const lowStockItems = (allProducts ?? [])
    .map((p) => ({
      ...p,
      currentStock: p.is_serialized
        ? (serializedCountMap[p.id] ?? 0)
        : p.quantity,
    }))
    .filter((p) => p.currentStock <= p.minimum_stock && p.minimum_stock > 0)
    .sort((a, b) => a.currentStock - b.currentStock)
    .slice(0, 4);

  // Brand summary

  const colorPalette = [
    { color: "#E1F5EE", textColor: "#0F6E56" },
    { color: "#DBEAFE", textColor: "#1E3A8A" },
    { color: "#FEE2E2", textColor: "#7F1D1D" },
    { color: "#FFF7ED", textColor: "#9A3412" },
    { color: "#F3E8FF", textColor: "#6B21A8" },
    { color: "#DCFCE7", textColor: "#14532D" },
  ];

  const brandStockMap: Record<string, { name: string; units: number }> = {};
  (allProducts ?? []).forEach((p) => {
    if (!p.brand_id) return;
    const stock = p.is_serialized
      ? (serializedCountMap[p.id] ?? 0)
      : p.quantity;
    if (!brandStockMap[p.brand_id]) {
      const brand = brandsData?.find((b) => b.id === p.brand_id);
      brandStockMap[p.brand_id] = { name: brand?.name ?? "Unknown", units: 0 };
    }
    brandStockMap[p.brand_id].units += stock;
  });

  const brandSummary = Object.values(brandStockMap)
    .sort((a, b) => b.units - a.units)
    .slice(0, 5)
    .map((b, i) => ({
      ...b,
      initial: b.name[0].toUpperCase(),
      ...colorPalette[i % colorPalette.length],
    }));

  const maxBrandUnits = brandSummary[0]?.units ?? 1;

  // Top products this month
  const productSalesMap: Record<string, number> = {};
  (topProductsData ?? []).forEach((s) => {
    productSalesMap[s.product_name] =
      (productSalesMap[s.product_name] ?? 0) + s.quantity_sold;
  });
  const topProducts = Object.entries(productSalesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, sold]) => ({ name, sold }));
  const maxSold = topProducts[0]?.sold ?? 1;

  // Chart bars — daily revenue for current month
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const dailyRevenue: number[] = Array(daysInMonth).fill(0);
  (chartSalesData ?? []).forEach((s) => {
    const day = new Date(s.sold_at).getDate() - 1;
    if (day >= 0 && day < daysInMonth) {
      dailyRevenue[day] += Number(s.selling_price);
    }
  });
  const maxDaily = Math.max(...dailyRevenue, 1);
  const chartBars = dailyRevenue.map((v) => Math.round((v / maxDaily) * 100));

  // Format currency
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `₦${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `₦${(n / 1_000).toFixed(0)}K`
        : `₦${n.toLocaleString()}`;

  const fmtFull = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const monthName = new Date().toLocaleString("en-NG", { month: "long" });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar
        storeName={profile.store_name}
        fullName={profile.full_name}
        role={profile.role}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {today} · {profile.store_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lowStockItems.length > 0 && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "#FFF7ED", color: "#9A3412" }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                {lowStockItems.length} alerts
              </div>
            )}
            <a
              href="/auth/signout"
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white lg:hidden"
              style={{ backgroundColor: "#1D9E75" }}
              title="Sign out"
            >
              {profile.full_name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </a>
            <div
              className="hidden lg:flex w-8 h-8 rounded-full items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: "#1D9E75" }}
            >
              {profile.full_name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(profile.role === "owner"
              ? [
                  {
                    label: "Monthly revenue",
                    value: fmt(monthlyRevenue),
                    change: revenueChange,
                    changeLabel: "vs last month",
                    positive: true,
                  },
                  {
                    label: "Monthly profit",
                    value: fmt(monthlyProfit),
                    change: profitChange,
                    changeLabel: "vs last month",
                    positive: true,
                  },
                  {
                    label: "Today's sales",
                    value: fmt(todayRevenue),
                    change: `${todayCount} transaction${todayCount !== 1 ? "s" : ""}`,
                    changeLabel: "",
                    positive: true,
                  },
                  {
                    label: "Low stock items",
                    value: String(lowStockItems.length),
                    change:
                      lowStockItems.length > 0
                        ? "Needs restocking"
                        : "All good",
                    warn: lowStockItems.length > 0,
                  },
                ]
              : [
                  {
                    label: "Today's transactions",
                    value: String(todayCount),
                    change: `${fmt(todayRevenue)} sold today`,
                    changeLabel: "",
                    positive: true,
                  },
                  {
                    label: "Low stock items",
                    value: String(lowStockItems.length),
                    change:
                      lowStockItems.length > 0
                        ? "Needs restocking"
                        : "All good",
                    warn: lowStockItems.length > 0,
                  },
                ]
            ).map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl p-4 border"
                style={{
                  borderColor: stat.warn ? "#FED7AA" : "#F3F4F6",
                  borderLeft: `4px solid ${stat.warn ? "#F97316" : "#1D9E75"}`,
                }}
              >
                <p
                  className="text-xs font-medium mb-2"
                  style={{ color: stat.warn ? "#9A3412" : "#6B7280" }}
                >
                  {stat.label}
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: stat.warn ? "#F97316" : "#111827" }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-xs mt-1.5 font-medium"
                  style={{ color: stat.warn ? "#F97316" : "#16A34A" }}
                >
                  {stat.change}
                </p>
              </div>
            ))}
          </div>

          {/* Revenue chart + Recent sales */}
          {profile.role === "owner" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  Revenue — {monthName}
                </h2>
              </div>
              {chartBars.every((b) => b === 0) ? (
                <div className="h-28 flex items-center justify-center">
                  <p className="text-sm text-gray-400">
                    No sales recorded this month yet
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-1 h-28">
                    {chartBars.map((val, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${Math.max(val, 2)}%`,
                          backgroundColor:
                            val > 80
                              ? "#1D9E75"
                              : val > 50
                                ? "#5DCAA5"
                                : "#E1F5EE",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {chartBars.map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 text-center text-xs text-gray-300"
                      >
                        {[0, 4, 9, 14, 19, 24, 29].includes(i) ? i + 1 : ""}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  Recent sales
                </h2>
              </div>
              {!recentSalesData || recentSalesData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <p className="text-sm text-gray-400">No sales yet</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Record your first sale to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {recentSalesData.map((sale, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3"
                      style={{
                        borderBottom:
                          i < recentSalesData.length - 1
                            ? "1px solid #F3F4F6"
                            : "none",
                      }}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900 truncate max-w-32">
                          {sale.product_name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {sale.stock_item_id ? "IMEI" : "Non-serial"} ·{" "}
                          {new Date(sale.sold_at).toLocaleTimeString("en-NG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {fmtFull(Number(sale.selling_price))}
                        </p>
                        <p
                          className="text-xs font-medium mt-0.5"
                          style={{ color: "#16A34A" }}
                        >
                          +{fmtFull(Number(sale.profit))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Low stock + Brand summary + P&L */}
          <div className={`grid grid-cols-1 gap-4 ${profile.role === "owner" ? "lg:grid-cols-3" : ""}`}>
            {/* Low stock */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  Low stock alerts
                </h2>
                {lowStockItems.length > 0 && (
                  <span
                    className="text-xs font-medium"
                    style={{ color: "#F97316" }}
                  >
                    Restock all
                  </span>
                )}
              </div>
              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-center">
                  <p className="text-sm text-gray-400">
                    All stock levels are good
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lowStockItems.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{
                        backgroundColor: "#FFF7ED",
                        borderLeft: "3px solid #F97316",
                      }}
                    >
                      <div>
                        <p
                          className="text-xs font-semibold truncate max-w-36"
                          style={{ color: "#9A3412" }}
                        >
                          {item.name}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "#C2410C" }}
                        >
                          {item.currentStock} left · min: {item.minimum_stock}
                        </p>
                      </div>
                      <button
                        className="text-xs font-semibold"
                        style={{ color: "#F97316" }}
                      >
                        + Stock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Brand summary */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  Stock by brand
                </h2>
              </div>
              {brandSummary.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-center">
                  <p className="text-sm text-gray-400">No brands added yet</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {brandSummary.map((brand, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 py-2.5"
                      style={{
                        borderBottom:
                          i < brandSummary.length - 1
                            ? "1px solid #F3F4F6"
                            : "none",
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          backgroundColor: brand.color,
                          color: brand.textColor,
                        }}
                      >
                        {brand.initial}
                      </div>
                      <span className="text-sm font-medium text-gray-800 flex-1">
                        {brand.name}
                      </span>
                      <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((brand.units / maxBrandUnits) * 100)}%`,
                            backgroundColor: "#1D9E75",
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-semibold text-right min-w-14"
                        style={{ color: "#0F6E56" }}
                      >
                        {brand.units} units
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* P&L — owner only */}
            {profile.role === "owner" && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  {monthName} P&L
                </h2>
              </div>
              <div className="space-y-0">
                {[
                  {
                    label: "Gross revenue",
                    value: fmtFull(monthlyRevenue),
                    color: "#111827",
                  },
                  {
                    label: "Cost of goods",
                    value:
                      monthlyRevenue > 0
                        ? `−${fmtFull(monthlyRevenue - monthlyProfit)}`
                        : "₦0",
                    color: "#DC2626",
                  },
                  {
                    label: "Gross profit",
                    value: fmtFull(monthlyProfit),
                    color: "#16A34A",
                  },
                  {
                    label: "Expenses",
                    value:
                      totalExpenses > 0 ? `−${fmtFull(totalExpenses)}` : "₦0",
                    color: "#DC2626",
                  },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <span className="text-sm text-gray-500">{row.label}</span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: row.color }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="flex items-center justify-between mt-3 px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: netProfit >= 0 ? "#E1F5EE" : "#FEE2E2",
                }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: "#0D3B2E" }}
                >
                  Net profit
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ color: netProfit >= 0 ? "#0D3B2E" : "#DC2626" }}
                >
                  {netProfit < 0 ? "−" : ""}
                  {fmtFull(Math.abs(netProfit))}
                </span>
              </div>
            </div>
              )}
          </div>

          {/* Top products */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Top selling this month
              </h2>
            </div>
            {topProducts.length === 0 ? (
              <div className="flex items-center justify-center h-16">
                <p className="text-sm text-gray-400">No sales this month yet</p>
              </div>
            ) : (
              <div className="space-y-0">
                {topProducts.map((product, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 py-3"
                    style={{
                      borderBottom:
                        i < topProducts.length - 1
                          ? "1px solid #F3F4F6"
                          : "none",
                    }}
                  >
                    <span className="text-xs font-bold text-gray-300 w-4">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800 flex-1">
                      {product.name}
                    </span>
                    <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((product.sold / maxSold) * 100)}%`,
                          backgroundColor: "#1D9E75",
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 min-w-12 text-right">
                      {product.sold} sold
                    </span>
                  </div>
                ))}
              </div>
            )}
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
            style={{
              color: item.href === "/dashboard" ? "#0D3B2E" : "#9CA3AF",
            }}
          >
            <NavIcon icon={item.icon} />
            <span className="text-xs font-medium">{item.label}</span>
            {item.href === "/dashboard" && (
              <div
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: "#0D3B2E" }}
              />
            )}
          </a>
        ))}
      </nav>
    </div>
  );
}

function NavIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactElement> = {
    dashboard: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="1.5"
          fill="currentColor"
          opacity="0.6"
        />
        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1.5"
          fill="currentColor"
          opacity="0.6"
        />
        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="1.5"
          fill="currentColor"
          opacity="0.3"
        />
      </svg>
    ),
    inventory: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    sales: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    reports: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M18 20V10M12 20V4M6 20v-6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    settings: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  };
  return icons[icon] || null;
}
