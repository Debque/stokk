import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import PageShell from "@/components/PageShell";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
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

  // Fetch brands
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name")
    .order("name");

  // Fetch products with brand info
  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, brand_id, category, is_serialized, cost_price, selling_price, quantity, minimum_stock, image_url",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch serialized stock counts
  const { data: stockItems } = await supabase
    .from("stock_items")
    .select("product_id, status")
    .eq("status", "in_stock");

  // Count in_stock units per product
  const stockCountMap: Record<string, number> = {};
  stockItems?.forEach((item) => {
    stockCountMap[item.product_id] = (stockCountMap[item.product_id] ?? 0) + 1;
  });

  // Merge stock counts into products
  const productsWithStock = (products ?? []).map((p) => ({
    ...p,
    currentStock: p.is_serialized ? (stockCountMap[p.id] ?? 0) : p.quantity,
  }));

  return (
    <PageShell
      storeName={profile.store_name}
      fullName={profile.full_name}
      role={profile.role}
    >
      <InventoryClient
        brands={brands ?? []}
        products={productsWithStock}
        profile={profile}
      />
    </PageShell>
  );
}
