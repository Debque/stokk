"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCompletePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function completeProfile() {
      // Get the pending profile data saved during onboarding
      const pending = localStorage.getItem("stokk_pending_profile");

      if (!pending) {
        // No pending profile — just go to dashboard
        router.push("/dashboard");
        return;
      }

      const profileData = JSON.parse(pending);

      // Get current user to confirm session is active
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Session expired. Please sign in.");
        return;
      }

      // Write the profile now that the session is confirmed
      const { error: profileError } = await supabase
        .from("profiles")
        .insert(profileData);

      if (profileError) {
        // Profile may already exist — try to continue anyway
        console.error("Profile insert error:", profileError.message);
      }

      // Clean up localStorage
      localStorage.removeItem("stokk_pending_profile");

      // Go to dashboard
      window.location.href = "/dashboard";
    }

    completeProfile();
  }, [router]);

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "#E1F5EE" }}
      >
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => window.location.href = "/login"}
            className="text-sm font-medium"
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
        <div>
          <h2 className="text-lg font-bold text-gray-900">Setting up your store</h2>
          <p className="text-sm text-gray-500 mt-1">Just a moment…</p>
        </div>
      </div>
    </div>
  );
}