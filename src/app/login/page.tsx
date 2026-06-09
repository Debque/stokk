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

  const isDisabled = loading || !email || !password;

  const features = [
    { label: "Live dashboard", desc: "— revenue, profit and stock at a glance" },
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
            <rect x="13" y="3" width="8" height="8" rx="2" fill="#5DCAA5" opacity="0.6" />
            <rect x="3" y="13" width="8" height="8" rx="2" fill="#5DCAA5" opacity="0.6" />
            <rect x="13" y="13" width="8" height="8" rx="2" fill="#5DCAA5" opacity="0.3" />
          </svg>
        </div>
        <h1 className="text-white text-2xl font-bold tracking-tight mb-1">Stokk</h1>
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
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#5DCAA5" }} />
          <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
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
              <rect x="13" y="3" width="8" height="8" rx="2" fill="#5DCAA5" opacity="0.6" />
              <rect x="3" y="13" width="8" height="8" rx="2" fill="#5DCAA5" opacity="0.6" />
              <rect x="13" y="13" width="8" height="8" rx="2" fill="#5DCAA5" opacity="0.3" />
            </svg>
          </div>
          <div>
            <div className="text-white text-lg font-bold tracking-tight">Stokk</div>
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
      <div className="flex-1 flex items-center justify-center p-6 bg-white min-h-screen lg:min-h-0">
        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">
              Sign in to your Stokk account
            </p>
          </div>

          {/* Fields */}
          <div className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
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
                  boxShadow: email
                    ? "0 0 0 2px rgba(29,158,117,0.15)"
                    : "none",
                }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
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
            <div className="text-right -mt-1">
              <button
                type="button"
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

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">
                or continue with
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google button */}
            <button
              type="button"
              className="w-full h-11 flex items-center justify-center gap-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
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
    </div>
  );
}