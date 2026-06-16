import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import PageShell from "@/components/PageShell";
import SuppliersClient from "./SuppliersClient";

export default async function SuppliersPage() {
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

  if (profile.role !== "owner") redirect("/dashboard");

  // Fetch all suppliers
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, phone, address, notes, created_at")
    .order("name");

  // Fetch stock purchases with supplier info
  const { data: purchases } = await supabase
    .from("stock_purchases")
    .select(
      "id, product_id, quantity, unit_cost, total_cost, supplier, purchased_at",
    )
    .order("purchased_at", { ascending: false });

  // Fetch products for purchase display
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .is("deleted_at", null);

  return (
    <PageShell
      storeName={profile.store_name}
      fullName={profile.full_name}
      role={profile.role}
    >
      <SuppliersClient
        suppliers={suppliers ?? []}
        purchases={purchases ?? []}
        products={products ?? []}
        profile={profile}
      />
    </PageShell>
  );
}
