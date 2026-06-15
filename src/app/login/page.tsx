"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [showForgotPassword, setShowForgotPassword] = useState(false);
const [resetEmail, setResetEmail] = useState("");
const [resetLoading, setResetLoading] = useState(false);
const [resetSent, setResetSent] = useState(false);
const [resetError, setResetError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/dashboard";
    }

    setLoading(false);
  }

  async function handleForgotPassword() {
  if (!resetEmail) {
    setResetError("Please enter your email address.");
    return;
  }

  setResetLoading(true);
  setResetError(null);

  const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
    redirectTo: `${window.location.origin}/auth/reset`,
  });

  if (error) {
    setResetError(error.message);
  } else {
    setResetSent(true);
  }

  setResetLoading(false);
}

  const isDisabled = loading || !email || !password;

  const features = [
    {
      label: "Live dashboard",
      desc: "— revenue, profit and stock at a glance",
    },
    { label: "IMEI tracking", desc: "— every phone from purchase to sale" },
    { label: "Low stock alerts", desc: "— never miss a restock again" },
    { label: "Role-based access", desc: "— your profit data stays private" },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── MOBILE: green hero top section ── */}
      <div
        className="lg:hidden flex flex-col items-center justify-center pt-12 pb-8 px-6 text-center"
        style={{ backgroundColor: "#0D3B2E" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="8" height="8" rx="2" fill="#5DCAA5" />
            <rect
              x="13"
              y="3"
              width="8"
              height="8"
              rx="2"
              fill="#5DCAA5"
              opacity="0.6"
            />
            <rect
              x="3"
              y="13"
              width="8"
              height="8"
              rx="2"
              fill="#5DCAA5"
              opacity="0.6"
            />
            <rect
              x="13"
              y="13"
              width="8"
              height="8"
              rx="2"
              fill="#5DCAA5"
              opacity="0.3"
            />
          </svg>
        </div>
        <h1 className="text-white text-2xl font-bold tracking-tight mb-1">
          Stokk
        </h1>
        <p className="text-sm mb-4" style={{ color: "#5DCAA5" }}>
          Smart Inventory & Profit
        </p>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#5DCAA5" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "rgba(255,255,255,0.8)" }}
          >
            HOPEX COMMS
          </span>
        </div>
      </div>

      {/* ── DESKTOP: left green panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: "#0D3B2E" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="#5DCAA5" />
              <rect
                x="13"
                y="3"
                width="8"
                height="8"
                rx="2"
                fill="#5DCAA5"
                opacity="0.6"
              />
              <rect
                x="3"
                y="13"
                width="8"
                height="8"
                rx="2"
                fill="#5DCAA5"
                opacity="0.6"
              />
              <rect
                x="13"
                y="13"
                width="8"
                height="8"
                rx="2"
                fill="#5DCAA5"
                opacity="0.3"
              />
            </svg>
          </div>
          <div>
            <div className="text-white text-lg font-bold tracking-tight">
              Stokk
            </div>
            <div className="text-xs" style={{ color: "#5DCAA5" }}>
              Smart Inventory & Profit
            </div>
          </div>
        </div>

        {/* Hero text + features */}
        <div className="space-y-8">
          <div>
            <h2 className="text-white text-4xl font-bold leading-tight mb-2">
              Know what you have.
            </h2>
            <h2
              className="text-4xl font-bold leading-tight mb-4"
              style={{ color: "#5DCAA5" }}
            >
              Know what you made.
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Real-time stock visibility, automatic profit tracking, and full
              IMEI accountability — all in one place.
            </p>
          </div>
          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#5DCAA5" }}
                  />
                </div>
                <span
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  <span className="font-semibold text-white">{f.label}</span>{" "}
                  {f.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom pill */}
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl w-fit"
          style={{
            backgroundColor: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#5DCAA5" }}
          />
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            Currently serving
          </span>
          <span className="text-sm font-bold text-white">HOPEX COMMS</span>
        </div>
      </div>

      {/* ── Right panel — sign in form ── */}
      <div className="flex-1 flex items-start justify-center pt-10 px-6 pb-6 bg-white lg:items-center lg:p-6">
        <div className="w-full max-w-sm text-center lg:text-left">
          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back 👋
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Sign in to your Stokk account
            </p>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 text-left block">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 px-3 rounded-lg border text-sm outline-none transition"
                style={{
                  borderColor: email ? "#1D9E75" : "#E5E7EB",
                  boxShadow: email ? "0 0 0 2px rgba(29,158,117,0.15)" : "none",
                }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 text-left block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 px-3 pr-10 rounded-lg border text-sm outline-none transition"
                  style={{
                    borderColor: password ? "#1D9E75" : "#E5E7EB",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-right -mt-1 lg:text-right">
              <button
  type="button"
  onClick={() => setShowForgotPassword(true)}
  className="text-sm font-medium hover:underline"
  style={{ color: "#0F6E56" }}
>
  Forgot password?
</button>
            </div>

            {/* Error */}
            {error && (
              <p
                className="text-sm px-3 py-2 rounded-lg bg-red-50"
                style={{ color: "#EF4444" }}
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isDisabled}
              style={{
                backgroundColor: isDisabled ? "#9CA3AF" : "#0D3B2E",
              }}
              className="w-full h-11 text-white text-sm font-semibold rounded-lg transition disabled:cursor-not-allowed"
              onMouseEnter={(e) => {
                if (!isDisabled)
                  e.currentTarget.style.backgroundColor = "#0F6E56";
              }}
              onMouseLeave={(e) => {
                if (!isDisabled)
                  e.currentTarget.style.backgroundColor = "#0D3B2E";
              }}
            >
              {loading ? "Please wait…" : "Sign in to Stokk"}
            </button>
          </div>

          {/* Bottom link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => router.push("/onboarding")}
              className="font-semibold hover:underline"
              style={{ color: "#0F6E56" }}
            >
              Create one
            </button>
          </p>
        </div>
      </div>
      {/* Forgot password modal */}
      {showForgotPassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Reset password</h2>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                  setResetEmail("");
                  setResetError(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {resetSent ? (
                <div className="text-center space-y-4 py-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: "#E1F5EE" }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 6l-10 7L2 6" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Check your email</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      We sent a password reset link to <span className="font-semibold">{resetEmail}</span>. Click the link to set a new password.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetSent(false);
                      setResetEmail("");
                    }}
                    className="w-full h-11 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor: "#0D3B2E" }}
                  >
                    Back to login
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Email address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                      style={{ borderColor: resetEmail ? "#1D9E75" : "#E5E7EB" }}
                    />
                  </div>
                  {resetError && (
                    <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                      {resetError}
                    </p>
                  )}
                  <button
                    onClick={handleForgotPassword}
                    disabled={resetLoading || !resetEmail}
                    className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: "#0D3B2E" }}
                  >
                    {resetLoading ? "Sending…" : "Send reset link"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
