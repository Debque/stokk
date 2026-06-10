import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import IMEIClient from "./IMEIClient";

interface Props {
  searchParams: Promise<{ product?: string }>;
}

export default async function IMEIPage({ searchParams }: Props) {
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

  const params = await searchParams;
  const productId = params.product;

  // Fetch all serialized products for the selector
  const { data: products } = await supabase
    .from("products")
    .select("id, name, brand_id, is_serialized, cost_price")
    .eq("is_serialized", true)
    .is("deleted_at", null)
    .order("name");

  // Fetch brands
  const { data: brands } = await supabase.from("brands").select("id, name");

  // Fetch stock items for selected product
  let stockItems = null;
  let selectedProduct = null;

  if (productId) {
    const { data: product } = await supabase
      .from("products")
      .select("id, name, brand_id, cost_price, is_serialized")
      .eq("id", productId)
      .single();

    selectedProduct = product;

    const { data: items } = await supabase
      .from("stock_items")
      .select(
        "id, imei, variant, cost_price, status, condition_notes, purchased_at, sold_at, sale_id",
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    // For sold items get sale details
    if (items && items.length > 0) {
      const soldItems = items.filter((i) => i.sale_id);
      if (soldItems.length > 0) {
        const saleIds = soldItems.map((i) => i.sale_id);
        const { data: sales } = await supabase
          .from("sales")
          .select("id, selling_price, profit, sold_at")
          .in("id", saleIds);

        const salesMap = Object.fromEntries(
          (sales ?? []).map((s) => [s.id, s]),
        );
        stockItems = items.map((item) => ({
          ...item,
          sale: item.sale_id ? salesMap[item.sale_id] : null,
        }));
      } else {
        stockItems = items.map((item) => ({ ...item, sale: null }));
      }
    } else {
      stockItems = [];
    }
  }

  // Summary stats
  const totalRegistered = stockItems?.length ?? 0;
  const inStock =
    stockItems?.filter((i: { status: string }) => i.status === "in_stock")
      .length ?? 0;
  const sold =
    stockItems?.filter((i: { status: string }) => i.status === "sold").length ??
    0;
  const faulty =
    stockItems?.filter(
      (i: { status: string }) =>
        i.status === "faulty" || i.status === "returned",
    ).length ?? 0;
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar
        storeName={profile.store_name}
        fullName={profile.full_name}
        role={profile.role}
      />
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <IMEIClient
          products={products ?? []}
          brands={brands ?? []}
          selectedProduct={selectedProduct}
          stockItems={stockItems ?? []}
          stats={{ totalRegistered, inStock, sold, faulty }}
          profile={profile}
          initialProductId={productId ?? null}
        />
      </main>
    </div>
  );
}
