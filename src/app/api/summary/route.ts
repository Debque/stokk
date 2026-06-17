import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, storeName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Use service role to fetch data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch today's sales
    const { data: todaySales } = await supabase
      .from("sales")
      .select("selling_price, profit, product_name")
      .gte("sold_at", startOfToday);

    // Fetch monthly sales
    const { data: monthlySales } = await supabase
      .from("sales")
      .select("selling_price, profit")
      .gte("sold_at", startOfMonth);

    // Fetch monthly expenses
    const { data: monthlyExpenses } = await supabase
      .from("expenses")
      .select("amount")
      .gte("expense_date", startOfMonth.split("T")[0]);

    // Fetch low stock
    const { data: products } = await supabase
      .from("products")
      .select("id, name, quantity, minimum_stock, is_serialized")
      .is("deleted_at", null);

    const { data: serializedStock } = await supabase
      .from("stock_items")
      .select("product_id")
      .eq("status", "in_stock");

    const serializedCountMap: Record<string, number> = {};
    serializedStock?.forEach((item) => {
      serializedCountMap[item.product_id] = (serializedCountMap[item.product_id] ?? 0) + 1;
    });

    const lowStockItems = (products ?? [])
      .map((p) => ({
        name: p.name,
        currentStock: p.is_serialized ? (serializedCountMap[p.id] ?? 0) : p.quantity,
        minimum_stock: p.minimum_stock,
      }))
      .filter((p) => p.currentStock <= p.minimum_stock && p.minimum_stock > 0)
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 5);

    // Calculations
    const todayRevenue = todaySales?.reduce((sum, s) => sum + Number(s.selling_price), 0) ?? 0;
    const todayProfit = todaySales?.reduce((sum, s) => sum + Number(s.profit), 0) ?? 0;
    const todayCount = todaySales?.length ?? 0;
    const monthlyRevenue = monthlySales?.reduce((sum, s) => sum + Number(s.selling_price), 0) ?? 0;
    const monthlyProfit = monthlySales?.reduce((sum, s) => sum + Number(s.profit), 0) ?? 0;
    const totalExpenses = monthlyExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
    const netProfit = monthlyProfit - totalExpenses;

    const fmt = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
    const monthName = now.toLocaleString("en-NG", { month: "long", year: "numeric" });
    const dateStr = now.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    // Send email via Resend
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error: emailError } = await resend.emails.send({
      from: `${storeName} <noreply@stokkco.com>`,
      to: email,
      subject: `${storeName} — Daily Summary · ${now.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff">

          <div style="margin-bottom:24px">
            <div style="display:inline-flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;background:#0D3B2E;border-radius:8px;display:flex;align-items:center;justify-content:center">
                <span style="color:#5DCAA5;font-size:18px;font-weight:700">S</span>
              </div>
              <span style="font-size:20px;font-weight:700;color:#0D3B2E">Stokk</span>
            </div>
          </div>

          <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 4px">Daily Summary</h1>
          <p style="font-size:13px;color:#6B7280;margin:0 0 28px">${dateStr}</p>

          <!-- Today's performance -->
          <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin-bottom:20px">
            <p style="font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 16px">Today</p>
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #E5E7EB">
                  <span style="font-size:13px;color:#6B7280">Transactions</span>
                </td>
                <td style="padding:8px 0;border-bottom:1px solid #E5E7EB;text-align:right">
                  <span style="font-size:13px;font-weight:600;color:#111827">${todayCount}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #E5E7EB">
                  <span style="font-size:13px;color:#6B7280">Revenue</span>
                </td>
                <td style="padding:8px 0;border-bottom:1px solid #E5E7EB;text-align:right">
                  <span style="font-size:13px;font-weight:600;color:#111827">${fmt(todayRevenue)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0">
                  <span style="font-size:13px;color:#6B7280">Profit</span>
                </td>
                <td style="padding:8px 0;text-align:right">
                  <span style="font-size:13px;font-weight:600;color:#16A34A">${fmt(todayProfit)}</span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Monthly summary -->
          <div style="background:#E1F5EE;border-radius:12px;padding:20px;margin-bottom:20px">
            <p style="font-size:12px;font-weight:600;color:#0F6E56;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 16px">${monthName}</p>
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06)">
                  <span style="font-size:13px;color:#0F6E56">Revenue</span>
                </td>
                <td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);text-align:right">
                  <span style="font-size:13px;font-weight:600;color:#0D3B2E">${fmt(monthlyRevenue)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06)">
                  <span style="font-size:13px;color:#0F6E56">Gross profit</span>
                </td>
                <td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);text-align:right">
                  <span style="font-size:13px;font-weight:600;color:#0D3B2E">${fmt(monthlyProfit)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06)">
                  <span style="font-size:13px;color:#0F6E56">Expenses</span>
                </td>
                <td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);text-align:right">
                  <span style="font-size:13px;font-weight:600;color:#DC2626">−${fmt(totalExpenses)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0 0">
                  <span style="font-size:14px;font-weight:700;color:#0D3B2E">Net profit</span>
                </td>
                <td style="padding:10px 0 0;text-align:right">
                  <span style="font-size:16px;font-weight:700;color:${netProfit >= 0 ? "#0D3B2E" : "#DC2626"}">${fmt(netProfit)}</span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Low stock -->
          ${lowStockItems.length > 0 ? `
          <div style="background:#FFF7ED;border-radius:12px;padding:20px;margin-bottom:20px;border-left:4px solid #F97316">
            <p style="font-size:12px;font-weight:600;color:#9A3412;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px">⚠️ Low Stock (${lowStockItems.length} item${lowStockItems.length !== 1 ? "s" : ""})</p>
            ${lowStockItems.map((item) => `
              <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.06)">
                <span style="font-size:13px;color:#9A3412">${item.name}</span>
                <span style="font-size:13px;font-weight:600;color:#DC2626">${item.currentStock} left (min: ${item.minimum_stock})</span>
              </div>
            `).join("")}
          </div>
          ` : `
          <div style="background:#DCFCE7;border-radius:12px;padding:16px;margin-bottom:20px">
            <p style="font-size:13px;color:#14532D;margin:0">✅ All stock levels are good — no items need restocking.</p>
          </div>
          `}

          <div style="border-top:1px solid #F3F4F6;margin:24px 0 16px"></div>
          <p style="font-size:12px;color:#9CA3AF;margin:0">
            Stokk · ${storeName} · Daily summary
          </p>
        </div>
      `,
    });

    if (emailError) throw emailError;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}