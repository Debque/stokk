"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // Handle the hash fragment from Supabase reset email
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const type = hashParams.get("type");

    if (type === "recovery" && accessToken && refreshToken) {
      // Set the session from the tokens in the URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          setExpired(true);
        } else {
          setReady(true);
        }
      });
    } else {
      // Check if already have a valid session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setReady(true);
        } else {
          // Listen for PASSWORD_RECOVERY event
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
              if (event === "PASSWORD_RECOVERY" && session) {
                setReady(true);
              }
            }
          );
          // If nothing happens in 5 seconds, show expired
          const timeout = setTimeout(() => setExpired(true), 5000);
          return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
          };
        }
      });
    }
  }, []);

  async function handleReset() {
    if (!password) {
      setError("Please enter a new password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  // Expired or invalid link
  if (expired) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "#E1F5EE" }}
      >
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Link expired</h2>
            <p className="text-sm text-gray-500">
              This password reset link has expired or is invalid. Request a new one.
            </p>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="w-full h-11 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#0D3B2E" }}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // Loading — waiting for session
  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "#E1F5EE" }}
      >
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: "#E1F5EE" }}
          >
            <svg
              className="animate-spin"
              width="24" height="24" viewBox="0 0 24 24" fill="none"
            >
              <circle cx="12" cy="12" r="10" stroke="#E1F5EE" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0110 10" stroke="#1D9E75" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-sm text-gray-500">Verifying reset link…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "#E1F5EE" }}
    >
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full space-y-5">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#0D3B2E" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="#5DCAA5"/>
              <rect x="13" y="3" width="8" height="8" rx="2" fill="#5DCAA5" opacity="0.6"/>
              <rect x="3" y="13" width="8" height="8" rx="2" fill="#5DCAA5" opacity="0.6"/>
              <rect x="13" y="13" width="8" height="8" rx="2" fill="#5DCAA5" opacity="0.3"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "#0D3B2E" }}>Stokk</p>
            <p className="text-xs text-gray-400">Reset your password</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">Set new password</h2>
          <p className="text-sm text-gray-500 mt-1">
            Choose a strong password for your account.
          </p>
        </div>

        <div className="space-y-4">

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">New password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full h-11 px-3 pr-10 rounded-xl border text-sm outline-none"
                style={{ borderColor: password ? "#1D9E75" : "#E5E7EB" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
              style={{
                borderColor: confirmPassword
                  ? password === confirmPassword ? "#1D9E75" : "#EF4444"
                  : "#E5E7EB",
              }}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs" style={{ color: "#EF4444" }}>
                Passwords do not match
              </p>
            )}
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
            onClick={handleReset}
            disabled={loading || !password || !confirmPassword}
            className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0D3B2E" }}
          >
            {loading ? "Updating password…" : "Set new password"}
          </button>

          <button
            onClick={() => router.push("/login")}
            className="w-full text-sm font-medium text-center hover:underline"
            style={{ color: "#6B7280" }}
          >
            Back to login
          </button>

        </div>
      </div>
    </div>
  );
}