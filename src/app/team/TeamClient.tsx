"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

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
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

      if (!response.ok) {
        throw new Error(result.error ?? "Something went wrong.");
      }

      setSuccess(`${form.firstName} has been added to ${profile.store_name}. They can sign in immediately with their email and password.`);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "attendant",
      });
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

      if (!response.ok) {
        throw new Error(result.error ?? "Something went wrong.");
      }

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
    <div>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 py-4 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Team</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""} · {profile.store_name}
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: "#0D3B2E" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Add member
        </button>
      </div>

      <div className="p-4 lg:p-6 space-y-5">

        {/* Success */}
        {success && (
          <div
            className="p-4 rounded-2xl text-sm font-medium flex items-center gap-3"
            style={{ backgroundColor: "#DCFCE7", color: "#14532D" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {success}
          </div>
        )}

        {/* Info box */}
        <div
          className="p-4 rounded-2xl text-sm"
          style={{ backgroundColor: "#E1F5EE", border: "1px solid #5DCAA5" }}
        >
          <p className="font-semibold mb-2" style={{ color: "#0D3B2E" }}>Role permissions</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { role: "Store Owner", desc: "Full access — inventory, sales, reports, expenses, profit data", color: "#0D3B2E", bg: "#E1F5EE" },
              { role: "Sales Attendant", desc: "Record sales and check stock only — no financial data", color: "#9A3412", bg: "#FFF7ED" },
            ].map((r) => (
              <div key={r.role} className="p-3 rounded-xl" style={{ backgroundColor: r.bg }}>
                <p className="text-xs font-bold mb-1" style={{ color: r.color }}>{r.role}</p>
                <p className="text-xs leading-tight" style={{ color: r.color, opacity: 0.8 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team members list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Team members</h2>
          </div>

          {teamMembers.length === 0 ? (
            <div className="p-12 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#E1F5EE" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="#1D9E75" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">No team members yet</p>
              <p className="text-xs text-gray-400 mb-4">Add your sales attendants to give them access</p>
              <button
                onClick={() => setShowInvite(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "#0D3B2E" }}
              >
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
                    style={{ borderBottom: i < teamMembers.length - 1 ? "1px solid #F3F4F6" : "none" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: isOwner ? "#0D3B2E" : "#1D9E75" }}
                      >
                        {getInitials(member.full_name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{member.full_name}</p>
                          {isCurrentUser && (
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}
                            >
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                            style={{
                              backgroundColor: isOwner ? "#E1F5EE" : "#FFF7ED",
                              color: isOwner ? "#0F6E56" : "#9A3412",
                            }}
                          >
                            {isOwner ? "Store Owner" : "Sales Attendant"}
                          </span>
                          <span className="text-xs text-gray-400">
                            Added {new Date(member.created_at).toLocaleDateString("en-NG", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isCurrentUser && !isOwner && (
                      <button
                        onClick={() => setShowDeleteConfirm(member.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border transition hover:bg-red-50"
                        style={{ borderColor: "#FEE2E2", color: "#DC2626" }}
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
        <div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Add team member</h2>
                <p className="text-xs text-gray-400 mt-0.5">{profile.store_name}</p>
              </div>
              <button
                onClick={() => { setShowInvite(false); setError(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">First name *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="e.g. Tunde"
                    className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: form.firstName ? "#1D9E75" : "#E5E7EB" }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Last name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="e.g. Bakare"
                    className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "#E5E7EB" }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Email address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="tunde@example.com"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: form.email ? "#1D9E75" : "#E5E7EB" }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: form.password ? "#1D9E75" : "#E5E7EB" }}
                />
                <p className="text-xs text-gray-400">
                  Share this password with the team member so they can sign in.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Role</label>
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
                        borderColor: form.role === r.value ? "#1D9E75" : "#E5E7EB",
                        backgroundColor: form.role === r.value ? "#E1F5EE" : "#fff",
                      }}
                    >
                      <span className="text-2xl mb-1">{r.emoji}</span>
                      <span className="text-xs font-semibold text-gray-900">{r.title}</span>
                      <span className="text-xs text-gray-400 mt-0.5 leading-tight">{r.desc}</span>
                      {form.role === r.value && (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center mt-1.5"
                          style={{ backgroundColor: "#1D9E75" }}
                        >
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p
                  className="text-sm px-3 py-2 rounded-xl"
                  style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                >
                  {error}
                </p>
              )}

              <button
                onClick={handleInvite}
                disabled={loading || !form.firstName || !form.email || !form.password}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#0D3B2E" }}
              >
                {loading ? "Adding member…" : "Add team member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && memberToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: "#FEE2E2" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">
                  Remove {memberToDelete.full_name}?
                </h2>
                <p className="text-sm text-gray-500">
                  They will lose access to Stokk immediately. Their sales history will be preserved.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 h-11 rounded-xl border text-sm font-semibold"
                  style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={deleteLoading}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: "#DC2626" }}
                >
                  {deleteLoading ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 grid grid-cols-5 z-20"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Sales", href: "/sales" },
          { label: "Reports", href: "/reports" },
          { label: "More", href: "/settings" },
        ].map((item) => (
          
            <a key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center py-3 gap-1"
            style={{ color: "#9CA3AF" }}
          >
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}