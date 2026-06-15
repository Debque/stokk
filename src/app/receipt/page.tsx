import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ReceiptClient from "./ReceiptClient";

interface Props {
  searchParams: Promise<{ sale?: string }>;
}

export default async function ReceiptPage({ searchParams }: Props) {
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
  const saleId = params.sale;

  if (!saleId) redirect("/sales");

  // Fetch the sale
  const { data: sale } = await supabase
    .from("sales")
    .select("id, product_id, product_name, brand_name, quantity_sold, selling_price, cost_price_at_sale, profit, sold_at, stock_item_id, customer_name, via_quick_sale")
    .eq("id", saleId)
    .single();

  if (!sale) redirect("/sales");

  // Fetch IMEI if serialized
  let imei = null;
  let variant = null;
  if (sale.stock_item_id) {
    const { data: stockItem } = await supabase
      .from("stock_items")
      .select("imei, variant")
      .eq("id", sale.stock_item_id)
      .single();
    imei = stockItem?.imei ?? null;
    variant = stockItem?.variant ?? null;
  }

  return (
    <ReceiptClient
      sale={sale}
      imei={imei}
      variant={variant}
      storeName={profile.store_name}
      isOwner={profile.role === "owner"}
    />
  );
}