import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
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

  // Fetch all sales with customer names
  const { data: sales } = await supabase
    .from("sales")
    .select("id, product_name, brand_name, quantity_sold, selling_price, profit, sold_at, customer_name, stock_item_id")
    .not("customer_name", "is", null)
    .order("sold_at", { ascending: false });

  // Group by customer name
  type SaleRow = {
    id: string;
    product_name: string;
    brand_name: string | null;
    quantity_sold: number;
    selling_price: number;
    profit: number;
    sold_at: string;
    customer_name: string | null;
    stock_item_id: string | null;
  };

  const customerMap: Record<string, {
    name: string;
    totalSpend: number;
    totalProfit: number;
    purchases: SaleRow[];
    lastPurchase: string;
    purchaseCount: number;
  }> = {};

  (sales ?? []).forEach((sale) => {
    const name = sale.customer_name!;
    if (!customerMap[name]) {
      customerMap[name] = {
        name,
        totalSpend: 0,
        totalProfit: 0,
        purchases: [],
        lastPurchase: sale.sold_at,
        purchaseCount: 0,
      };
    }
    customerMap[name].totalSpend += Number(sale.selling_price);
    customerMap[name].totalProfit += Number(sale.profit);
    customerMap[name].purchases.push(sale as SaleRow);
    customerMap[name].purchaseCount += 1;
    if (sale.sold_at > customerMap[name].lastPurchase) {
      customerMap[name].lastPurchase = sale.sold_at;
    }
  });

  const customers = Object.values(customerMap)
    .sort((a, b) => b.totalSpend - a.totalSpend);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar
        storeName={profile.store_name}
        fullName={profile.full_name}
        role={profile.role}
      />
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <CustomersClient
          customers={customers}
          profile={profile}
        />
      </main>
    </div>
  );
}