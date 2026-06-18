"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Confirming your account…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const tokenHash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type");

        setStatus("Verifying your email…");

        let userId: string | null = null;

        if (tokenHash && !tokenHash.startsWith("pkce_")) {
          // Regular OTP token hash
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: (type as "signup" | "email") ?? "email",
          });
          if (verifyError) { setError(`Verification failed: ${verifyError.message}`); return; }
          userId = data?.user?.id ?? null;

        } else if (tokenHash && tokenHash.startsWith("pkce_")) {
          // PKCE token hash — exchange as session code
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(tokenHash);
          if (exchangeError) { setError(`Verification failed: ${exchangeError.message}`); return; }
          userId = data?.user?.id ?? null;

        } else if (code) {
          // Standard PKCE code
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) { setError(`Verification failed: ${exchangeError.message}`); return; }
          userId = data?.user?.id ?? null;

        } else {
          setError("No confirmation code found. Please try signing up again.");
          return;
        }

        if (!userId) {
          setError("Could not verify your account. Please try again.");
          return;
        }

        setStatus("Setting up your account…");

        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .single();

        if (!existingProfile) {
          // Create profile via API with service role
          const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });
          const result = await response.json();
          if (!response.ok) {
            setError(`Account setup failed: ${result.error}`);
            return;
          }
        }

        setStatus("Taking you to your dashboard…");
        window.location.href = "/dashboard";

      } catch (err) {
        setError(`Something went wrong: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    handleCallback();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#E1F5EE" }}>
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "#FEE2E2" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Confirmation failed</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{error}</p>
          </div>
          <button onClick={() => window.location.href = "/login"} className="w-full h-11 text-white text-sm font-semibold rounded-lg" style={{ backgroundColor: "#0D3B2E" }}>
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#E1F5EE" }}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-5">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "#E1F5EE" }}>
          <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#E1F5EE" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0110 10" stroke="#1D9E75" strokeWidth="3" strokeLinecap="round"/>
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