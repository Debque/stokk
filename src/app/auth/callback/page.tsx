"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Confirming your account…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
const tokenHash = url.searchParams.get("token_hash");
const type = url.searchParams.get("type");

if (!code && !tokenHash) {
  setError("No confirmation code found. Please try signing up again.");
  return;
}

setStatus("Verifying your email…");

let data: { user: import("@supabase/supabase-js").User | null; session: import("@supabase/supabase-js").Session | null } | undefined;
let exchangeError: import("@supabase/supabase-js").AuthError | null = null;

if (tokenHash && type) {
  // Token hash based verification
  const result = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "signup" | "email",
  });
  data = result.data;
  exchangeError = result.error;
} else if (code) {
  // PKCE code based verification
  const result = await supabase.auth.exchangeCodeForSession(code);
  data = result.data;
  exchangeError = result.error;
}

        if (exchangeError || !data) {
          setError(exchangeError?.message || "Something went wrong. Please try again.");
          return;
        }

        if (!data?.user) {
          setError("Could not verify your account. Please try again.");
          return;
        }
setStatus("Taking you to your dashboard…");
        // Profile was already created during signup — just redirect
        window.location.href = "/dashboard";
      } catch (err) {
        console.error("Callback error:", err);
        setError("Something went wrong. Please try signing in.");
      }
    }

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "#E1F5EE" }}
      >
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="#DC2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Confirmation failed
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => (window.location.href = "/onboarding")}
            className="w-full h-11 text-white text-sm font-semibold rounded-lg"
            style={{ backgroundColor: "#0D3B2E" }}
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = "/login")}
            className="text-sm font-medium hover:underline"
            style={{ color: "#0F6E56" }}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "#E1F5EE" }}
    >
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-5">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: "#E1F5EE" }}
        >
          <svg
            className="animate-spin"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="10" stroke="#E1F5EE" strokeWidth="3" />
            <path
              d="M12 2a10 10 0 0110 10"
              stroke="#1D9E75"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{status}</h2>
          <p className="text-sm text-gray-400 mt-1">Please don&apos;t close this tab</p>
        </div>
      </div>
    </div>
  );
}