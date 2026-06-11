import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AdjustmentsClient from "./AdjustmentsClient";

export default async function AdjustmentsPage() {
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

  // Fetch products (non-serialized only for quantity adjustments)
  const { data: products } = await supabase
    .from("products")
    .select("id, name, brand_id, is_serialized, quantity, minimum_stock")
    .is("deleted_at", null)
    .order("name");

  // Fetch brands
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name");

  // Fetch recent adjustments
  const { data: adjustments } = await supabase
    .from("stock_adjustments")
    .select("id, product_id, quantity_change, reason, notes, adjusted_at")
    .order("adjusted_at", { ascending: false })
    .limit(30);

  // Fetch serialized stock counts
  const { data: stockItems } = await supabase
    .from("stock_items")
    .select("product_id, status")
    .eq("status", "in_stock");

  const stockCountMap: Record<string, number> = {};
  stockItems?.forEach((item) => {
    stockCountMap[item.product_id] = (stockCountMap[item.product_id] ?? 0) + 1;
  });

  const productsWithStock = (products ?? []).map((p) => ({
    ...p,
    currentStock: p.is_serialized ? (stockCountMap[p.id] ?? 0) : p.quantity,
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar
        storeName={profile.store_name}
        fullName={profile.full_name}
        role={profile.role}
      />
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <AdjustmentsClient
          products={productsWithStock}
          brands={brands ?? []}
          adjustments={adjustments ?? []}
          profile={profile}
        />
      </main>
    </div>
  );
}