"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface Sale {
  id: string;
  product_name: string;
  brand_name: string | null;
  quantity_sold: number;
  selling_price: number;
  cost_price_at_sale: number;
  profit: number;
  sold_at: string;
  stock_item_id: string | null;
  customer_name: string | null;
  via_quick_sale: boolean;
}

interface Props {
  sale: Sale;
  imei: string | null;
  variant: string | null;
  storeName: string;
  isOwner: boolean;
}

export default function ReceiptClient({ sale, imei, variant, storeName, isOwner }: Props) {
  const router = useRouter();

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

  const saleDate = new Date(sale.sold_at).toLocaleDateString("en-NG", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const saleTime = new Date(sale.sold_at).toLocaleTimeString("en-NG", {
    hour: "2-digit", minute: "2-digit",
  });

  const receiptRef = `STK-${sale.id.slice(0, 8).toUpperCase()}`;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3F4F6" }}>

      {/* Action bar — hidden when printing */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 py-4 bg-white border-b border-gray-100 print:hidden"
      >
        <button
          onClick={() => router.push("/sales")}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "#6B7280" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to sales
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#0D3B2E" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Print receipt
          </button>
        </div>
      </div>

      {/* Receipt */}
      <div className="max-w-sm mx-auto p-6 print:p-0 print:max-w-none">
        <div
          className="bg-white rounded-2xl overflow-hidden print:rounded-none print:shadow-none"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
        >
          {/* Header */}
          <div
            className="px-6 py-8 text-center"
            style={{ backgroundColor: "#0D3B2E" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="2" fill="#5DCAA5"/>
                <rect x="13" y="3" width="8" height="8" rx="2" fill="#5DCAA5" opacity="0.6"/>
                <rect x="3" y="13" width="8" height="8" rx="2" fill="#5DCAA5" opacity="0.6"/>
                <rect x="13" y="13" width="8" height="8" rx="2" fill="#5DCAA5" opacity="0.3"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">{storeName}</h1>
            <p className="text-sm mt-1" style={{ color: "#5DCAA5" }}>Sales Receipt</p>
          </div>

          {/* Receipt ref + date */}
          <div
            className="flex items-center justify-between px-6 py-3"
            style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}
          >
            <div>
              <p className="text-xs text-gray-400">Receipt No.</p>
              <p className="text-sm font-bold text-gray-900">{receiptRef}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">{saleDate}</p>
              <p className="text-sm font-medium text-gray-600">{saleTime}</p>
            </div>
          </div>

          {/* Customer */}
          {sale.customer_name && (
            <div className="px-6 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <p className="text-xs text-gray-400 mb-0.5">Customer</p>
              <p className="text-sm font-semibold text-gray-900">{sale.customer_name}</p>
            </div>
          )}

          {/* Product details */}
          <div className="px-6 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Item</p>
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">
                    {sale.brand_name ? `${sale.brand_name} ` : ""}{sale.product_name}
                  </p>
                  {variant && (
                    <p className="text-xs text-gray-500 mt-0.5">{variant}</p>
                  )}
                  {imei && (
                    <p className="text-xs font-mono mt-0.5" style={{ color: "#0F6E56" }}>
                      IMEI: {imei}
                    </p>
                  )}
                  {sale.quantity_sold > 1 && (
                    <p className="text-xs text-gray-500 mt-0.5">Qty: {sale.quantity_sold}</p>
                  )}
                </div>
                <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                  {fmt(Number(sale.selling_price))}
                </p>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="px-6 py-4 space-y-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="text-sm text-gray-900">{fmt(Number(sale.selling_price))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Discount</span>
              <span className="text-sm text-gray-900">₦0</span>
            </div>
          </div>

          {/* Total */}
          <div className="px-6 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold" style={{ color: "#0D3B2E" }}>
                {fmt(Number(sale.selling_price))}
              </span>
            </div>
          </div>

          {/* Profit — owner only, hidden when printing */}
          {isOwner && (
            <div className="px-6 py-3 print:hidden" style={{ backgroundColor: "#E1F5EE" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "#0F6E56" }}>Profit (visible to you only)</span>
                <span className="text-sm font-bold" style={{ color: "#0D3B2E" }}>
                  {fmt(Number(sale.profit))}
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-6 text-center">
            <p className="text-xs text-gray-400 leading-relaxed">
              Thank you for shopping at {storeName}.
            </p>
            <p className="text-xs text-gray-300 mt-2">
              Powered by Stokk
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:max-w-none { max-width: none !important; }
        }
      `}</style>
    </div>
  );
}