import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import StockClient from "./StockClient";

interface Props {
  searchParams: Promise<{ product?: string }>;
}

export default async function StockPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/onboarding");

  const params = await searchParams;
  const productId = params.product;

  if (!productId) redirect("/inventory");

  // Fetch the product
  const { data: product } = await supabase
    .from("products")
    .select("id, name, brand_id, is_serialized, cost_price, selling_price, quantity, minimum_stock")
    .eq("id", productId)
    .single();

  if (!product) redirect("/inventory");

  // Serialized products go to IMEI tracker
  if (product.is_serialized) {
    redirect(`/imei?product=${productId}`);
  }

  // Fetch brand
  const { data: brand } = await supabase
    .from("brands")
    .select("id, name")
    .eq("id", product.brand_id ?? "")
    .single();

  // Fetch stock purchase history
  const { data: purchases } = await supabase
    .from("stock_purchases")
    .select("id, quantity, unit_cost, total_cost, supplier, purchased_at, notes")
    .eq("product_id", productId)
    .order("purchased_at", { ascending: false });
// Fetch suppliers for autocomplete
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name")
    .order("name");
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar
        storeName={profile.store_name}
        fullName={profile.full_name}
        role={profile.role}
      />
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <StockClient
          product={{ ...product, brandName: brand?.name ?? "" }}
          purchases={purchases ?? []}
          suppliers={suppliers ?? []}
          profile={profile}
        />
      </main>
    </div>
  );
}