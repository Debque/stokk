import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import SalesClient from "./SalesClient";

export default async function SalesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/onboarding");

  // Fetch all products
  const { data: products } = await supabase
    .from("products")
    .select("id, name, brand_id, is_serialized, cost_price, selling_price, quantity, minimum_stock")
    .is("deleted_at", null)
    .order("name");

  // Fetch brands
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name");

  // Fetch available (in_stock) serialized units
  const { data: stockItems } = await supabase
    .from("stock_items")
    .select("id, product_id, imei, variant, cost_price, status")
    .eq("status", "in_stock");

  // Fetch recent sales
  const { data: recentSales } = await supabase
    .from("sales")
    .select("id, product_name, brand_name, quantity_sold, selling_price, profit, sold_at, stock_item_id, customer_name, via_quick_sale")
    .order("sold_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar
        storeName={profile.store_name}
        fullName={profile.full_name}
        role={profile.role}
      />
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <SalesClient
          products={products ?? []}
          brands={brands ?? []}
          stockItems={stockItems ?? []}
          recentSales={recentSales ?? []}
          profile={profile}
        />
      </main>
    </div>
  );
}