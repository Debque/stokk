import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ExpensesClient from "./ExpensesClient";

export default async function ExpensesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/onboarding");

  // Only owners can see expenses
  if (profile.role !== "owner") redirect("/dashboard");

  // Fetch expenses for current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, title, category, amount, expense_date, notes")
    .gte("expense_date", startOfMonth)
    .order("expense_date", { ascending: false });

  // Total this month
  const totalThisMonth = (expenses ?? []).reduce(
    (sum, e) => sum + Number(e.amount), 0
  );

  // Group by category
  const categoryTotals: Record<string, number> = {};
  (expenses ?? []).forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + Number(e.amount);
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar
        storeName={profile.store_name}
        fullName={profile.full_name}
        role={profile.role}
      />
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <ExpensesClient
          expenses={expenses ?? []}
          totalThisMonth={totalThisMonth}
          categoryTotals={categoryTotals}
          profile={profile}
        />
      </main>
    </div>
  );
}