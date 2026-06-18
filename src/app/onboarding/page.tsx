"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<"owner" | "attendant">("owner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Password strength
  const getStrength = (p: string) => {
    if (p.length === 0) return 0;
    if (p.length < 6) return 1;
    if (p.length < 10) return 2;
    return 3;
  };
  const strength = getStrength(password);
  const strengthLabel = ["", "Weak", "Good", "Strong password"][strength];
  const strengthColor = ["", "#EF4444", "#F97316", "#1D9E75"][strength];
  const strengthWidth = ["0%", "33%", "66%", "100%"][strength];

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Sign up with Supabase auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // If email confirmation is enabled, session will be null
    // Use API route with service role to create profile
    if (!data.session) {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          fullName: `${firstName} ${lastName}`.trim(),
          storeName,
          role,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      setEmailSent(true);
      setLoading(false);
      return;
    }

    // If no email confirmation (session exists), write profile immediately
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: `${firstName} ${lastName}`.trim(),
      store_name: storeName,
      role,
      currency: "NGN",
      sidebar_collapsed: false,
      inventory_view: "grid",
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  const isDisabled =
    loading ||
    !firstName ||
    !storeName ||
    !email ||
    !password ||
    !confirmPassword;
  const steps = [
    {
      num: 1,
      done: true,
      title: "Create your account",
      desc: "Set your store name, email, and password. Takes 2 minutes.",
    },
    {
      num: 2,
      done: false,
      title: "Add your first product",
      desc: "Add a product with its cost price and selling price. Serialized or non-serialized.",
    },
    {
      num: 3,
      done: false,
      title: "Record your first sale",
      desc: "Watch Stokk automatically update your stock and calculate your profit.",
    },
  ];

  // ── Email confirmation screen ──
  if (emailSent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "#E1F5EE" }}
      >
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 text-center space-y-5">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: "#E1F5EE" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                stroke="#1D9E75"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 6l-10 7L2 6"
                stroke="#1D9E75"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Text */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Check your email
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              We sent a confirmation link to{" "}
              <span className="font-semibold text-gray-700">{email}</span>.
              Click the link in the email to activate your account.
            </p>
          </div>

          {/* Steps */}
          <div
            className="rounded-xl p-4 text-left space-y-2"
            style={{ backgroundColor: "#E1F5EE" }}
          >
            {[
              "Open your email inbox",
              "Find the email from Stokk",
              'Click "Confirm my account"',
              "You'll be redirected to your dashboard",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                  style={{ backgroundColor: "#1D9E75" }}
                >
                  {i + 1}
                </div>
                <span className="text-sm text-gray-600">{step}</span>
              </div>
            ))}
          </div>

          {/* Resend */}
          <p className="text-xs text-gray-400">
            Didn&apos;t receive it?{" "}
            <button
              onClick={async () => {
                await supabase.auth.resend({
                  type: "signup",
                  email,
                });
              }}
              className="font-medium hover:underline"
              style={{ color: "#0F6E56" }}
            >
              Resend email
            </button>
          </p>

          <button
            onClick={() => router.push("/login")}
            className="text-sm font-medium hover:underline"
            style={{ color: "#0F6E56" }}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // ── Main registration form ──
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── MOBILE: dark green top header ── */}
      <div
        className="lg:hidden flex flex-col px-6 pt-10 pb-6 items-center text-center"
        style={{ backgroundColor: "#0D3B2E" }}
      >
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 text-sm mb-5 self-start"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M12 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to login
        </button>
        <h1 className="text-white text-2xl font-bold mb-1">Create account</h1>
        <p className="text-sm mb-4" style={{ color: "#5DCAA5" }}>
          Get started with Stokk — free forever
        </p>
        {/* Progress bar */}
        <div>
          <p
            className="text-xs mb-2"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Step 1 of 3 — Account details
          </p>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: "33%", backgroundColor: "#5DCAA5" }}
            />
          </div>
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

        {/* Hero + steps */}
        <div className="space-y-8">
          <div>
            <h2 className="text-white text-4xl font-bold leading-tight mb-2">
              Set up your store
            </h2>
            <h2
              className="text-4xl font-bold leading-tight mb-4"
              style={{ color: "#5DCAA5" }}
            >
              in 3 simple steps
            </h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Create your account and be fully operational in under 15 minutes.
            </p>
          </div>

          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={step.num}>
                <div className="flex gap-4 py-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{
                      backgroundColor: step.done ? "#1D9E75" : "transparent",
                      border: step.done
                        ? "none"
                        : "2px solid rgba(255,255,255,0.2)",
                      color: step.done ? "#fff" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {step.done ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="white"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      step.num
                    )}
                  </div>
                  <div className="pt-0.5">
                    <p className="text-sm font-semibold text-white">
                      {step.title}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="ml-4 w-px h-4"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                  />
                )}
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

      {/* ── Right panel / Mobile form ── */}
      <div className="flex-1 flex items-start lg:items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm pt-2 lg:pt-0">
          {/* Desktop heading */}
          <div className="hidden lg:block mb-7">
            <h2 className="text-2xl font-bold text-gray-900">
              Create your account
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Get started with Stokk — it&apos;s free
            </p>
          </div>

          <div className="space-y-4">
            {/* First + Last name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Adegoke"
                  className="w-full h-11 px-3 rounded-lg border text-sm outline-none transition"
                  style={{ borderColor: firstName ? "#1D9E75" : "#E5E7EB" }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Oduola"
                  className="w-full h-11 px-3 rounded-lg border text-sm outline-none transition"
                  style={{ borderColor: lastName ? "#1D9E75" : "#E5E7EB" }}
                />
              </div>
            </div>

            {/* Store name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Store name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. HOPEX COMMS"
                className="w-full h-11 px-3 rounded-lg border text-sm outline-none transition"
                style={{ borderColor: storeName ? "#1D9E75" : "#E5E7EB" }}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@hopexcomms.com"
                className="w-full h-11 px-3 rounded-lg border text-sm outline-none transition"
                style={{ borderColor: email ? "#1D9E75" : "#E5E7EB" }}
              />
            </div>

            {/* Password + strength bar */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full h-11 px-3 pr-10 rounded-lg border text-sm outline-none transition"
                  style={{ borderColor: password ? "#1D9E75" : "#E5E7EB" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && (
                <div>
                  <div className="h-1 rounded-full bg-gray-100 overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: strengthWidth,
                        backgroundColor: strengthColor,
                      }}
                    />
                  </div>
                  <p
                    className="text-xs mt-1 font-medium"
                    style={{ color: strengthColor }}
                  >
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full h-11 px-3 pr-10 rounded-lg border text-sm outline-none transition"
                  style={{
                    borderColor: confirmPassword
                      ? password === confirmPassword
                        ? "#1D9E75"
                        : "#EF4444"
                      : "#E5E7EB",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="text-xs font-medium" style={{ color: "#EF4444" }}>
                  Passwords do not match
                </p>
              )}
              {confirmPassword.length > 0 && password === confirmPassword && (
                <p className="text-xs font-medium" style={{ color: "#1D9E75" }}>
                  Passwords match ✓
                </p>
              )}
            </div>
            {/* Role selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Your role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: "owner" as const,
                    emoji: "👑",
                    title: "Store Owner",
                    desc: "Full access to all features including profits & reports",
                  },
                  {
                    value: "attendant" as const,
                    emoji: "🧑‍💼",
                    title: "Sales Attendant",
                    desc: "Record sales and check stock — no financial data",
                  },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className="relative flex flex-col items-center text-center p-4 rounded-xl border-2 transition"
                    style={{
                      borderColor: role === r.value ? "#1D9E75" : "#E5E7EB",
                      backgroundColor: role === r.value ? "#E1F5EE" : "#fff",
                    }}
                  >
                    <span className="text-2xl mb-2">{r.emoji}</span>
                    <span className="text-sm font-semibold text-gray-900 mb-1">
                      {r.title}
                    </span>
                    <span className="text-xs text-gray-500 leading-tight">
                      {r.desc}
                    </span>
                    {role === r.value && (
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center mt-2"
                        style={{ backgroundColor: "#1D9E75" }}
                      >
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M5 13l4 4L19 7"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
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

            {/* Terms */}
            <p className="text-xs text-gray-400 leading-relaxed">
              By creating an account you agree to our{" "}
              <span
                className="font-medium cursor-pointer"
                style={{ color: "#0F6E56" }}
              >
                Terms of Service
              </span>{" "}
              and{" "}
              <span
                className="font-medium cursor-pointer"
                style={{ color: "#0F6E56" }}
              >
                Privacy Policy
              </span>
              . Your data is encrypted and never shared.
            </p>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isDisabled}
              style={{ backgroundColor: isDisabled ? "#9CA3AF" : "#0D3B2E" }}
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
              {loading ? "Creating account…" : "Create my Stokk account"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="font-semibold hover:underline"
                style={{ color: "#0F6E56" }}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
