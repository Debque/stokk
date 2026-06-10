import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/onboarding");

  const initials = profile.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar
        storeName={profile.store_name}
        fullName={profile.full_name}
        role={profile.role}
      />

      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Settings</h1>
            <p className="text-xs text-gray-500 mt-0.5">{profile.store_name}</p>
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* Profile card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                style={{ backgroundColor: "#1D9E75" }}
              >
                {initials}
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">{profile.full_name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{profile.store_name}</p>
                <span
                  className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}
                >
                  {profile.role}
                </span>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {[
              { label: "Store name", value: profile.store_name },
              { label: "Email", value: user.email },
              { label: "Role", value: profile.role },
              { label: "Currency", value: profile.currency ?? "NGN" },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none" }}
              >
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Sign out button */}
          
            <a href="/auth/signout"
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border-2 text-sm font-semibold transition"
            style={{ borderColor: "#FEE2E2", color: "#DC2626", backgroundColor: "#FFF5F5" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign out
          </a>

        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 grid grid-cols-5 z-20"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {[
          { label: "Dashboard", href: "/dashboard", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.3"/></svg> },
          { label: "Inventory", href: "/inventory", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          { label: "Sales", href: "/sales", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          { label: "Reports", href: "/reports", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          { label: "More", href: "/settings", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
        ].map((item) => (
          
          <a  key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center py-3 gap-1"
            style={{ color: item.href === "/settings" ? "#0D3B2E" : "#9CA3AF" }}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
            {item.href === "/settings" && (
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "#0D3B2E" }} />
            )}
          </a>
        ))}
      </nav>
    </div>
  );
}