import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TeamClient from "./TeamClient";

export default async function TeamPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/onboarding");

  // Only owners can manage team
  if (profile.role !== "owner") redirect("/dashboard");

  // Fetch all team members (same store)
 // Use service role to fetch all team members (bypasses RLS)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: teamMembers } = await adminClient
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("store_name", profile.store_name)
    .order("created_at", { ascending: true });
  // Get emails from auth.users for each member
  // We can only get the current user's email from auth
  // Other members' emails are stored when they sign up

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar
        storeName={profile.store_name}
        fullName={profile.full_name}
        role={profile.role}
      />
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <TeamClient
          teamMembers={teamMembers ?? []}
          currentUserId={user.id}
          profile={profile}
        />
      </main>
    </div>
  );
}