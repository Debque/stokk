"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import MobileMenuButton from "@/components/MobileMenuButton";

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface Profile {
  role: string;
  store_name: string;
  full_name: string;
}

interface Props {
  teamMembers: TeamMember[];
  currentUserId: string;
  profile: Profile;
}

export default function TeamClient({ teamMembers, currentUserId, profile }: Props) {
  const router = useRouter();

  const [showInvite, setShowInvite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "attendant" as "owner" | "attendant",
  });

  function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }

  const memberToDelete = teamMembers.find((m) => m.id === showDeleteConfirm);

  async function handleInvite() {
    if (!form.firstName || !form.email || !form.password) {
      setError("First name, email and password are required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: `${form.firstName} ${form.lastName}`.trim(),
          role: form.role,
          storeName: profile.store_name,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Something went wrong.");

      setSuccess(`${form.firstName} has been added to ${profile.store_name}. They can sign in immediately with their email and password.`);
      setForm({ firstName: "", lastName: "", email: "", password: "", role: "attendant" });
      setShowInvite(false);
      router.refresh();
      setTimeout(() => setSuccess(null), 6000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(memberId: string) {
    if (memberId === currentUserId) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Something went wrong.");

      setShowDeleteConfirm(null);
      setSuccess("Team member removed successfully.");
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: "var(--bg-subtle)", minHeight: "100vh" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 py-4 border-b"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Team</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""} · {profile.store_name}
            </p>
          </div>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--brand-primary)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Add member
        </button>
      </div>

      <div className="p-4 lg:p-6 space-y-5">

        {success && (
          <div className="p-4 rounded-2xl text-sm font-medium flex items-center gap-3"
            style={{ backgroundColor: "var(--bg-success)", color: "var(--color-success-dark)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {success}
          </div>
        )}

        {/* Info box */}
        <div className="p-4 rounded-2xl text-sm" style={{ backgroundColor: "var(--bg-green)", border: "1px solid var(--brand-light)" }}>
          <p className="font-semibold mb-2" style={{ color: "var(--brand-primary)" }}>Role permissions</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { role: "Store Owner", desc: "Full access — inventory, sales, reports, expenses, profit data", color: "var(--brand-primary)", bg: "var(--bg-green-light)" },
              { role: "Sales Attendant", desc: "Record sales and check stock only — no financial data", color: "var(--color-warning-dark)", bg: "var(--bg-warning)" },
            ].map((r) => (
              <div key={r.role} className="p-3 rounded-xl" style={{ backgroundColor: r.bg }}>
                <p className="text-xs font-bold mb-1" style={{ color: r.color }}>{r.role}</p>
                <p className="text-xs leading-tight" style={{ color: r.color, opacity: 0.8 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team members list */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Team members</h2>
          </div>

          {teamMembers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--bg-green)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="var(--brand-mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="var(--brand-mid)" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="var(--brand-mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No team members yet</p>
              <p className="text-xs mb-4" style={{ color: "var(--text-faint)" }}>Add your sales attendants to give them access</p>
              <button onClick={() => setShowInvite(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--brand-primary)" }}>
                Add first member
              </button>
            </div>
          ) : (
            <div>
              {teamMembers.map((member, i) => {
                const isCurrentUser = member.id === currentUserId;
                const isOwner = member.role === "owner";
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: i < teamMembers.length - 1 ? `1px solid var(--border-subtle)` : "none" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: isOwner ? "var(--brand-primary)" : "var(--brand-mid)" }}
                      >
                        {getInitials(member.full_name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{member.full_name}</p>
                          {isCurrentUser && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: "var(--bg-green)", color: "var(--brand-dark)" }}>
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                            style={{
                              backgroundColor: isOwner ? "var(--bg-green)" : "var(--bg-warning)",
                              color: isOwner ? "var(--brand-dark)" : "var(--color-warning-dark)",
                            }}
                          >
                            {isOwner ? "Store Owner" : "Sales Attendant"}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                            Added {new Date(member.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isCurrentUser && !isOwner && (
                      <button
                        onClick={() => setShowDeleteConfirm(member.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border transition"
                        style={{ borderColor: "var(--bg-danger)", color: "var(--color-loss)" }}
                        title="Remove member"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add member modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Add team member</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{profile.store_name}</p>
              </div>
              <button onClick={() => { setShowInvite(false); setError(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: "var(--text-faint)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>First name *</label>
                  <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="e.g. Tunde" className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: form.firstName ? "var(--brand-mid)" : "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Last name</label>
                  <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="e.g. Bakare" className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}/>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Email address *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="tunde@example.com" className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: form.email ? "var(--brand-mid)" : "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}/>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Password *</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters" className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: form.password ? "var(--brand-mid)" : "var(--border-default)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}/>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  Share this password with the team member so they can sign in.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "attendant", emoji: "🧑‍💼", title: "Sales Attendant", desc: "Record sales and check stock only" },
                    { value: "owner", emoji: "👑", title: "Store Owner", desc: "Full access including financials" },
                  ].map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setForm({ ...form, role: r.value as "owner" | "attendant" })}
                      className="relative flex flex-col items-center text-center p-4 rounded-xl border-2 transition"
                      style={{
                        borderColor: form.role === r.value ? "var(--brand-mid)" : "var(--border-default)",
                        backgroundColor: form.role === r.value ? "var(--bg-green)" : "var(--bg-card)",
                      }}
                    >
                      <span className="text-2xl mb-1">{r.emoji}</span>
                      <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{r.title}</span>
                      <span className="text-xs mt-0.5 leading-tight" style={{ color: "var(--text-faint)" }}>{r.desc}</span>
                      {form.role === r.value && (
                        <div className="w-4 h-4 rounded-full flex items-center justify-center mt-1.5" style={{ backgroundColor: "var(--brand-mid)" }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--bg-danger)", color: "var(--color-loss)" }}>{error}</p>}

              <button onClick={handleInvite} disabled={loading || !form.firstName || !form.email || !form.password}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--brand-primary)" }}>
                {loading ? "Adding member…" : "Add team member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "var(--bg-danger)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="var(--color-loss)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                  Remove {memberToDelete.full_name}?
                </h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  They will lose access to Stokk immediately. Their sales history will be preserved.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 h-11 rounded-xl border text-sm font-semibold"
                  style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(showDeleteConfirm)} disabled={deleteLoading}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-danger)" }}>
                  {deleteLoading ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t grid grid-cols-5 z-20"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Sales", href: "/sales" },
          { label: "Reports", href: "/reports" },
          { label: "More", href: "/settings" },
        ].map((item) => (
          <a key={item.href} href={item.href} className="flex flex-col items-center justify-center py-3 gap-1"
            style={{ color: "var(--text-faint)" }}>
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}