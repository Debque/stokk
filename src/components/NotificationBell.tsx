"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface LowStockItem {
  id: string;
  name: string;
  currentStock: number;
  minimum_stock: number;
  brand_name: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLowStock() {
      setLoading(true);
      try {
        const { data: products } = await supabase
          .from("products")
          .select("id, name, quantity, minimum_stock, is_serialized, brand_id")
          .is("deleted_at", null);

        const { data: brands } = await supabase.from("brands").select("id, name");

        const { data: serializedStock } = await supabase
          .from("stock_items")
          .select("product_id")
          .eq("status", "in_stock");

        const serializedCountMap: Record<string, number> = {};
        serializedStock?.forEach((item) => {
          serializedCountMap[item.product_id] = (serializedCountMap[item.product_id] ?? 0) + 1;
        });

        const lowStock = (products ?? [])
          .map((p) => ({
            id: p.id,
            name: p.name,
            currentStock: p.is_serialized ? (serializedCountMap[p.id] ?? 0) : p.quantity,
            minimum_stock: p.minimum_stock,
            brand_name: brands?.find((b) => b.id === p.brand_id)?.name ?? "",
          }))
          .filter((p) => p.currentStock <= p.minimum_stock && p.minimum_stock > 0)
          .sort((a, b) => a.currentStock - b.currentStock);

        setItems(lowStock);
      } finally {
        setLoading(false);
      }
    }

    fetchLowStock();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl transition"
        style={{ color: "var(--text-muted)" }}
        title="Low stock alerts"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {items.length > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: "var(--color-orange)", fontSize: "10px" }}
          >
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 w-80 rounded-2xl border z-50 overflow-hidden"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-subtle)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Low stock alerts</h3>
            {items.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--bg-warning)", color: "var(--color-warning-dark)" }}>
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <p className="text-sm" style={{ color: "var(--text-faint)" }}>Loading…</p>
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
                  style={{ backgroundColor: "var(--bg-success)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="var(--color-profit)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>All stock levels good</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>No items need restocking</p>
              </div>
            ) : (
              <div>
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-3 transition cursor-pointer"
                    style={{ borderBottom: i < items.length - 1 ? `1px solid var(--border-subtle)` : "none" }}
                    onClick={() => { setOpen(false); router.push(`/inventory/stock?product=${item.id}`); }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: item.currentStock === 0 ? "var(--bg-danger)" : "var(--bg-warning)",
                          color: item.currentStock === 0 ? "var(--color-loss)" : "var(--color-orange)",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold truncate max-w-44" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                          {item.currentStock === 0 ? "Out of stock" : `${item.currentStock} left`} · min: {item.minimum_stock}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold flex-shrink-0" style={{ color: "var(--brand-mid)" }}>
                      + Restock
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <button
                onClick={() => { setOpen(false); router.push("/inventory?filter=low"); }}
                className="w-full text-xs font-semibold text-center"
                style={{ color: "var(--brand-dark)" }}
              >
                View all in inventory →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}