import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, store_name")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "owner") {
      return NextResponse.json({ error: "Only owners can add team members" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, fullName, role, storeName } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Email, password and name are required" }, { status: 400 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) throw createError;
    if (!newUser.user) throw new Error("Could not create user account.");

    const { error: profileError } = await adminClient.from("profiles").insert({
      id: newUser.user.id,
      full_name: fullName,
      store_name: storeName ?? profile.store_name,
      role: role ?? "attendant",
      currency: "NGN",
      sidebar_collapsed: false,
      inventory_view: "grid",
    });

    if (profileError) throw profileError;

    // Send welcome email
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: `${profile.store_name} <noreply@stokkco.com>`,
        to: email,
        subject: `You've been added to ${profile.store_name} on Stokk`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff">
            <div style="margin-bottom:32px">
              <div style="display:inline-flex;align-items:center;gap:10px">
                <div style="width:36px;height:36px;background:#0D3B2E;border-radius:8px;display:flex;align-items:center;justify-content:center">
                  <span style="color:#5DCAA5;font-size:18px;font-weight:700">S</span>
                </div>
                <span style="font-size:20px;font-weight:700;color:#0D3B2E">Stokk</span>
              </div>
            </div>

            <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px">
              You've been added to ${profile.store_name}
            </h1>
            <p style="font-size:14px;color:#6B7280;margin:0 0 28px;line-height:1.6">
              Hi ${fullName.split(" ")[0]}, you now have access to Stokk as a <strong>${role === "owner" ? "Store Owner" : "Sales Attendant"}</strong> for ${profile.store_name}.
            </p>

            <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin-bottom:28px">
              <p style="font-size:13px;font-weight:600;color:#374151;margin:0 0 12px">Your login details</p>
              <table style="width:100%;border-collapse:collapse">
                <tr>
                  <td style="font-size:13px;color:#6B7280;padding:6px 0;width:80px">Email</td>
                  <td style="font-size:13px;font-weight:600;color:#111827;padding:6px 0">${email}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6B7280;padding:6px 0">Password</td>
                  <td style="font-size:13px;font-weight:600;color:#111827;padding:6px 0">${password}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6B7280;padding:6px 0">Role</td>
                  <td style="font-size:13px;font-weight:600;color:#111827;padding:6px 0">${role === "owner" ? "Store Owner" : "Sales Attendant"}</td>
                </tr>
              </table>
            </div>

            <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://stokkco.com"}/login"
              style="display:inline-block;background:#0D3B2E;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;margin-bottom:28px">
              Sign in to Stokk
            </a>

            <p style="font-size:13px;color:#9CA3AF;margin:0 0 4px">
              Please change your password after signing in for the first time.
            </p>

            <div style="border-top:1px solid #F3F4F6;margin:28px 0"></div>
            <p style="font-size:12px;color:#D1D5DB;margin:0">
              Stokk · Built for ${profile.store_name}
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Welcome email failed:", emailErr);
    }

    return NextResponse.json({ success: true, userId: newUser.user.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "owner") {
      return NextResponse.json({ error: "Only owners can remove team members" }, { status: 403 });
    }

    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    if (memberId === user.id) {
      return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
    }

    const { error: authError } = await adminClient.auth.admin.deleteUser(memberId);

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    await adminClient.from("profiles").delete().eq("id", memberId);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}