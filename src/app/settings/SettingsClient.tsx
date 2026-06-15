"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import MobileMenuButton from "@/components/MobileMenuButton";

interface Profile {
  id: string;
  full_name: string;
  store_name: string;
  role: string;
  currency: string;
}

interface Props {
  profile: Profile;
  email: string;
}

export default function SettingsClient({ profile, email }: Props) {
 

  const [darkMode, setDarkMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem("stokk_dark_mode") === "true";
      setDarkMode(saved);
      if (saved) {
        document.documentElement.classList.add("dark");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("stokk_dark_mode", String(next));
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  async function handleChangePassword() {
    if (!newPassword) {
      setPasswordError("Enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      setTimeout(() => setPasswordSuccess(false), 4000);
    }
    setPasswordLoading(false);
  }

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Settings</h1>
            <p className="text-xs text-gray-500 mt-0.5">{profile.store_name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-4 max-w-2xl mx-auto">
        {/* Success */}
        {passwordSuccess && (
          <div
            className="p-4 rounded-2xl text-sm font-medium flex items-center gap-3"
            style={{ backgroundColor: "#DCFCE7", color: "#14532D" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Password updated successfully.
          </div>
        )}

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Account
          </p>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ backgroundColor: "#1D9E75" }}
            >
              {initials}
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">
                {profile.full_name}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">{email}</p>
              <span
                className="inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize"
                style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}
              >
                {profile.role === "owner" ? "Store Owner" : "Sales Attendant"}
              </span>
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-0">
            {[
              { label: "Store name", value: profile.store_name },
              { label: "Email", value: email },
              { label: "Currency", value: profile.currency ?? "NGN" },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-3"
                style={{
                  borderBottom:
                    i < arr.length - 1 ? "1px solid #F3F4F6" : "none",
                }}
              >
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-gray-900">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Security
          </p>

          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="w-full flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#E1F5EE" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      stroke="#1D9E75"
                      strokeWidth="2"
                    />
                    <path
                      d="M7 11V7a5 5 0 0110 0v4"
                      stroke="#1D9E75"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    Change password
                  </p>
                  <p className="text-xs text-gray-400">
                    Update your account password
                  </p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: newPassword ? "#1D9E75" : "#E5E7EB" }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{
                    borderColor: confirmPassword
                      ? newPassword === confirmPassword
                        ? "#1D9E75"
                        : "#EF4444"
                      : "#E5E7EB",
                  }}
                />
              </div>
              {passwordError && (
                <p
                  className="text-sm px-3 py-2 rounded-xl"
                  style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                >
                  {passwordError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordError(null);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="flex-1 h-11 rounded-xl border text-sm font-medium"
                  style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={passwordLoading || !newPassword || !confirmPassword}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: "#0D3B2E" }}
                >
                  {passwordLoading ? "Updating…" : "Update password"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Appearance
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: darkMode ? "#1F2937" : "#E1F5EE" }}
              >
                {darkMode ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                      stroke="#5DCAA5"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="5"
                      stroke="#1D9E75"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                      stroke="#1D9E75"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {darkMode ? "Dark mode" : "Light mode"}
                </p>
                <p className="text-xs text-gray-400">
                  {darkMode ? "Switch to light mode" : "Switch to dark mode"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className="w-11 h-6 rounded-full transition-all relative"
              style={{ backgroundColor: darkMode ? "#1D9E75" : "#D1D5DB" }}
            >
              <div
                className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all"
                style={{ left: darkMode ? "22px" : "2px" }}
              />
            </button>
          </div>
        </div>

        {/* App info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            About
          </p>
          <div className="space-y-0">
            {[
              { label: "App", value: "Stokk" },
              { label: "Version", value: "1.0.0" },
              { label: "Built for", value: profile.store_name },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-3"
                style={{
                  borderBottom:
                    i < arr.length - 1 ? "1px solid #F3F4F6" : "none",
                }}
              >
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-gray-900">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <a
          href="/auth/signout"
          className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border-2 text-sm font-semibold transition"
          style={{
            borderColor: "#FEE2E2",
            color: "#DC2626",
            backgroundColor: "#FFF5F5",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Sign out
        </a>
      </div>

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
          { label: "More", href: "/settings", active: true },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center py-3 gap-1"
            style={{ color: item.active ? "#0D3B2E" : "#9CA3AF" }}
          >
            <span className="text-xs font-medium">{item.label}</span>
            {item.active && (
              <div
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: "#0D3B2E" }}
              />
            )}
          </a>
        ))}
      </nav>
    </div>
  );
}
