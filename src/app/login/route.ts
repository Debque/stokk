import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Supabase sometimes POSTs to the site URL after email confirmation
  // Extract the code and redirect to the callback handler
  const formData = await request.formData();
  const code = formData.get("code");
  const next = formData.get("next") ?? "/dashboard";

  if (code) {
    return NextResponse.redirect(
      new URL(`/auth/callback?code=${code}`, request.url)
    );
  }

  return NextResponse.redirect(new URL(next as string, request.url));
}