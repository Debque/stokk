import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/onboarding");

  if (profile.role !== "owner") redirect("/dashboard");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const { data: monthlySales } = await supabase
    .from("sales")
    .select("id, product_name, brand_name, quantity_sold, selling_price, cost_price_at_sale, profit, sold_at, stock_item_id")
    .gte("sold_at", startOfMonth)
    .order("sold_at", { ascending: false });

  const { data: lastMonthSales } = await supabase
    .from("sales")
    .select("selling_price, profit")
    .gte("sold_at", startOfLastMonth)
    .lte("sold_at", endOfLastMonth);

  const { data: monthlyExpenses } = await supabase
    .from("expenses")
    .select("id, title, category, amount, expense_date")
    .gte("expense_date", startOfMonth.split("T")[0])
    .order("expense_date", { ascending: false });

  const { data: stockItems } = await supabase
    .from("stock_items")
    .select("id, imei, variant, cost_price, status, condition_notes, purchased_at, sold_at, product_id, sale_id")
    .order("created_at", { ascending: false });

  const { data: products } = await supabase
    .from("products")
    .select("id, name, brand_id")
    .is("deleted_at", null);

  const { data: brands } = await supabase
    .from("brands")
    .select("id, name");

  const soldSaleIds = (stockItems ?? [])
    .filter((s) => s.sale_id)
    .map((s) => s.sale_id);

  let salesMap: Record<string, { selling_price: number; profit: number }> = {};
  if (soldSaleIds.length > 0) {
    const { data: salesData } = await supabase
      .from("sales")
      .select("id, selling_price, profit")
      .in("id", soldSaleIds);
    salesMap = Object.fromEntries((salesData ?? []).map((s) => [s.id, s]));
  }

  const grossRevenue = (monthlySales ?? []).reduce((sum, s) => sum + Number(s.selling_price), 0);
  const grossProfit = (monthlySales ?? []).reduce((sum, s) => sum + Number(s.profit), 0);
  const totalExpenses = (monthlyExpenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = grossProfit - totalExpenses;

  const lastMonthRevenue = (lastMonthSales ?? []).reduce((sum, s) => sum + Number(s.selling_price), 0);
  const lastMonthProfit = (lastMonthSales ?? []).reduce((sum, s) => sum + Number(s.profit), 0);

  const revenueChange = lastMonthRevenue > 0
    ? Math.round(((grossRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : null;
  const profitChange = lastMonthProfit > 0
    ? Math.round(((grossProfit - lastMonthProfit) / lastMonthProfit) * 100)
    : null;

  const productMap: Record<string, { name: string; brand: string; units: number; revenue: number; profit: number }> = {};
  (monthlySales ?? []).forEach((s) => {
    const key = s.product_name;
    if (!productMap[key]) {
      productMap[key] = { name: s.product_name, brand: s.brand_name ?? "", units: 0, revenue: 0, profit: 0 };
    }
    productMap[key].units += s.quantity_sold;
    productMap[key].revenue += Number(s.selling_price);
    productMap[key].profit += Number(s.profit);
  });
  const productPerformance = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);

  const weeklyRevenue = [0, 0, 0, 0];
  (monthlySales ?? []).forEach((s) => {
    const day = new Date(s.sold_at).getDate();
    const week = Math.min(Math.floor((day - 1) / 7), 3);
    weeklyRevenue[week] += Number(s.selling_price);
  });

  const imeiReport = (stockItems ?? []).map((item) => {
    const product = products?.find((p) => p.id === item.product_id);
    const brand = brands?.find((b) => b.id === product?.brand_id);
    const sale = item.sale_id ? salesMap[item.sale_id] : null;
    return {
      ...item,
      product_name: product?.name ?? "Unknown",
      brand_name: brand?.name ?? "",
      sale,
    };
  });

  const expenseCategoryMap: Record<string, number> = {};
  (monthlyExpenses ?? []).forEach((e) => {
    expenseCategoryMap[e.category] = (expenseCategoryMap[e.category] ?? 0) + Number(e.amount);
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar
        storeName={profile.store_name}
        fullName={profile.full_name}
        role={profile.role}
      />
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <ReportsClient
          grossRevenue={grossRevenue}
          grossProfit={grossProfit}
          totalExpenses={totalExpenses}
          netProfit={netProfit}
          revenueChange={revenueChange}
          profitChange={profitChange}
          productPerformance={productPerformance}
          weeklyRevenue={weeklyRevenue}
          imeiReport={imeiReport}
          monthlyExpenses={monthlyExpenses ?? []}
          expenseCategoryMap={expenseCategoryMap}
          profile={profile}
        />
      </main>
    </div>
  );
}