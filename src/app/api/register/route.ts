import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fullName, storeName, role } = body;

    if (!userId || !fullName || !storeName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: profileError } = await adminClient.from("profiles").insert({
      id: userId,
      full_name: fullName,
      store_name: storeName,
      role: role ?? "owner",
      currency: "NGN",
      sidebar_collapsed: false,
      inventory_view: "grid",
    });

    if (profileError && !profileError.message.includes("duplicate")) {
      throw profileError;
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}