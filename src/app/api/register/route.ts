import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fullName, storeName, role } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if profile already exists
    const { data: existing } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, already_exists: true });
    }

    // Get user metadata from auth if fullName/storeName not provided
    let finalFullName = fullName;
    let finalStoreName = storeName;
    let finalRole = role ?? "owner";

    if (!finalFullName || !finalStoreName) {
      const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
      const meta = authUser?.user?.user_metadata;
      finalFullName = finalFullName ?? meta?.full_name ?? "Store Owner";
      finalStoreName = finalStoreName ?? meta?.store_name ?? "My Store";
      finalRole = finalRole ?? meta?.role ?? "owner";
    }

    const { error: profileError } = await adminClient.from("profiles").insert({
      id: userId,
      full_name: finalFullName,
      store_name: finalStoreName,
      role: finalRole,
      currency: "NGN",
      sidebar_collapsed: false,
      inventory_view: "grid",
    });

    if (profileError) {
      if (profileError.message.includes("duplicate")) {
        return NextResponse.json({ success: true, already_exists: true });
      }
      throw profileError;
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}