import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import PageShell from "@/components/PageShell";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
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

  return (
    <PageShell
      storeName={profile.store_name}
      fullName={profile.full_name}
      role={profile.role}
    >
      <SettingsClient profile={profile} email={user.email ?? ""} />
    </PageShell>
  );
}
