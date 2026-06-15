"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MobileMenuButton from "@/components/MobileMenuButton";

interface Product {
  id: string;
  name: string;
  brand_id: string | null;
  is_serialized: boolean;
  cost_price: number;
  selling_price: number;
  quantity: number;
  minimum_stock: number;
}

interface Brand {
  id: string;
  name: string;
}

interface StockItem {
  id: string;
  product_id: string;
  imei: string;
  variant: string | null;
  cost_price: number;
  status: string;
}

interface Sale {
  id: string;
  product_id: string;
  product_name: string;
  brand_name: string | null;
  quantity_sold: number;
  selling_price: number;
  profit: number;
  sold_at: string;
  stock_item_id: string | null;
  customer_name: string | null;
  via_quick_sale: boolean;
}

interface Profile {
  role: string;
  store_name: string;
  full_name: string;
}

interface Props {
  products: Product[];
  brands: Brand[];
  stockItems: StockItem[];
  recentSales: Sale[];
  profile: Profile;
}

export default function SalesClient({
  products,
  brands,
  stockItems,
  recentSales,
  profile,
}: Props) {
  const router = useRouter();
  const isOwner = profile.role === "owner";

  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showDeleteSale, setShowDeleteSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedStockItemId, setSelectedStockItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [sellingPrice, setSellingPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? null;

  const availableUnits = useMemo(() => {
    if (!selectedProductId) return [];
    return stockItems.filter((s) => s.product_id === selectedProductId);
  }, [selectedProductId, stockItems]);

  const selectedUnit = stockItems.find((s) => s.id === selectedStockItemId) ?? null;

  const costPrice = selectedProduct?.is_serialized
    ? selectedUnit ? Number(selectedUnit.cost_price) : 0
    : Number(selectedProduct?.cost_price ?? 0);

  const estimatedProfit = sellingPrice
    ? Number(sellingPrice) - costPrice * (selectedProduct?.is_serialized ? 1 : Number(quantity))
    : 0;

  const brandName = brands.find((b) => b.id === selectedProduct?.brand_id)?.name ?? "";

  function resetForm() {
    setSelectedProductId("");
    setSelectedStockItemId("");
    setQuantity("1");
    setSellingPrice("");
    setCustomerName("");
    setSaleDate(new Date().toISOString().split("T")[0]);
    setError(null);
  }

  function handleProductSelect(productId: string) {
    setSelectedProductId(productId);
    setSelectedStockItemId("");
    const product = products.find((p) => p.id === productId);
    if (product) setSellingPrice(String(product.selling_price));
  }

  function validate(): string | null {
    if (!selectedProduct) return "Please select a product.";
    if (selectedProduct.is_serialized && !selectedStockItemId) return "Please select an IMEI unit.";
    if (!selectedProduct.is_serialized) {
      const qty = Number(quantity);
      if (!qty || qty < 1) return "Quantity must be at least 1.";
      if (qty > selectedProduct.quantity) return `Only ${selectedProduct.quantity} units in stock.`;
    }
    if (!sellingPrice || Number(sellingPrice) <= 0) return "Selling price is required.";
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError(null);

    try {
      const qty = selectedProduct!.is_serialized ? 1 : Number(quantity);
      const unitCost = selectedProduct!.is_serialized
        ? Number(selectedUnit!.cost_price)
        : Number(selectedProduct!.cost_price);

      const { error: saleError } = await supabase.from("sales").insert({
        product_id: selectedProduct!.id,
        stock_item_id: selectedProduct!.is_serialized ? selectedStockItemId : null,
        product_name: selectedProduct!.name,
        brand_name: brandName || null,
        quantity_sold: qty,
        selling_price: Number(sellingPrice),
        cost_price_at_sale: selectedProduct!.is_serialized
          ? Number(stockItems.find((s) => s.id === selectedStockItemId)?.cost_price ?? 0)
          : Number(selectedProduct!.cost_price) * qty,
        via_quick_sale: false,
        customer_name: customerName.trim() || null,
        sold_at: new Date(saleDate).toISOString(),
      });

      if (saleError) throw saleError;

      if (selectedProduct!.is_serialized) {
        const { error: stockError } = await supabase
          .from("stock_items")
          .update({ status: "sold", sold_at: new Date(saleDate).toISOString() })
          .eq("id", selectedStockItemId);
        if (stockError) throw stockError;
      } else {
        const { error: stockError } = await supabase
          .from("products")
          .update({ quantity: selectedProduct!.quantity - qty })
          .eq("id", selectedProduct!.id);
        if (stockError) throw stockError;
      }

      setSuccess(`Sale recorded — ${selectedProduct!.name} for ${fmt(Number(sellingPrice))}. Profit: ${fmt(estimatedProfit)}`);
      resetForm();
      setShowSaleForm(false);
      router.refresh();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSale() {
    if (!showDeleteSale) return;
    setDeleteLoading(true);

    try {
      const { error: saleError } = await supabase
        .from("sales")
        .delete()
        .eq("id", showDeleteSale.id);

      if (saleError) throw saleError;

      if (showDeleteSale.stock_item_id) {
        await supabase
          .from("stock_items")
          .update({ status: "in_stock", sold_at: null, sale_id: null })
          .eq("id", showDeleteSale.stock_item_id);
      } else {
        // Non-serialized — fetch current quantity then restore
        console.log("Restoring non-serialized stock for product:", showDeleteSale.product_id);
        console.log("Quantity to restore:", showDeleteSale.quantity_sold);

        const { data: currentProduct, error: fetchError } = await supabase
          .from("products")
          .select("quantity")
          .eq("id", showDeleteSale.product_id)
          .single();

        console.log("Current product:", currentProduct, "Fetch error:", fetchError);

        if (currentProduct) {
          const newQty = currentProduct.quantity + showDeleteSale.quantity_sold;
          console.log("New quantity will be:", newQty);

          const { error: updateError } = await supabase
            .from("products")
            .update({ quantity: newQty })
            .eq("id", showDeleteSale.product_id);

          console.log("Update error:", updateError);
        }
      }
      setShowDeleteSale(null);
      setSuccess("Sale deleted and stock restored.");
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Sales</h1>
            <p className="text-xs text-gray-500 mt-0.5">{recentSales.length} recent transactions</p>
          </div>
        </div>
        <button
          onClick={() => setShowSaleForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: "#0D3B2E" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Record sale
        </button>
      </div>

      <div className="p-4 lg:p-6 space-y-5">
        {success && (
          <div
            className="p-4 rounded-2xl text-sm font-medium flex items-center gap-3"
            style={{ backgroundColor: "#DCFCE7", color: "#14532D" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {success}
          </div>
        )}

        {/* Recent sales table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent sales</h2>
          </div>

          {recentSales.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#E1F5EE" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">No sales yet</p>
              <p className="text-xs text-gray-400 mb-4">Record your first sale to see it here</p>
              <button
                onClick={() => setShowSaleForm(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "#0D3B2E" }}
              >
                Record first sale
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#F9FAFB" }}>
                    {["Product", "Type", "Qty", "Sold for", "Profit", "Customer", "Date", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale, i) => (
                    <tr key={sale.id} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900 truncate max-w-36">{sale.product_name}</p>
                        {sale.brand_name && <p className="text-xs text-gray-400">{sale.brand_name}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: sale.stock_item_id ? "#E1F5EE" : "#F3F4F6",
                            color: sale.stock_item_id ? "#0F6E56" : "#6B7280",
                          }}
                        >
                          {sale.stock_item_id ? "IMEI" : "Non-serial"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sale.quantity_sold}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{fmt(Number(sale.selling_price))}</td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color: Number(sale.profit) >= 0 ? "#16A34A" : "#DC2626" }}>
                        {Number(sale.profit) >= 0 ? "+" : ""}{fmt(Number(sale.profit))}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{sale.customer_name ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(sale.sold_at).toLocaleDateString("en-NG", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      {isOwner && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setShowDeleteSale(sale)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition hover:bg-red-50"
                            style={{ color: "#DC2626" }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Sale form modal */}
      {showSaleForm && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Record a sale</h2>
              <button
                onClick={() => { setShowSaleForm(false); resetForm(); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Product *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none bg-white"
                  style={{ borderColor: selectedProductId ? "#1D9E75" : "#E5E7EB" }}
                >
                  <option value="">— Select a product —</option>
                  {products.map((p) => {
                    const brand = brands.find((b) => b.id === p.brand_id);
                    const stock = p.is_serialized
                      ? stockItems.filter((s) => s.product_id === p.id).length
                      : p.quantity;
                    return (
                      <option key={p.id} value={p.id} disabled={stock === 0}>
                        {brand ? `${brand.name} ` : ""}{p.name} ({stock} in stock)
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedProduct?.is_serialized && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Select IMEI unit *</label>
                  {availableUnits.length === 0 ? (
                    <div
                      className="w-full h-11 px-3 rounded-xl border flex items-center text-sm"
                      style={{ borderColor: "#FEE2E2", backgroundColor: "#FFF5F5", color: "#DC2626" }}
                    >
                      No units in stock — register IMEIs first
                    </div>
                  ) : (
                    <select
                      value={selectedStockItemId}
                      onChange={(e) => setSelectedStockItemId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border text-sm outline-none bg-white"
                      style={{ borderColor: selectedStockItemId ? "#1D9E75" : "#E5E7EB" }}
                    >
                      <option value="">— Select IMEI unit —</option>
                      {availableUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.imei}{unit.variant ? ` — ${unit.variant}` : ""} (Cost: {fmt(Number(unit.cost_price))})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {selectedProduct && !selectedProduct.is_serialized && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Quantity * <span className="text-gray-400 font-normal">({selectedProduct.quantity} in stock)</span>
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    max={selectedProduct.quantity}
                    className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "#E5E7EB" }}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Selling price (₦) *
                  {selectedProduct && (
                    <span className="text-gray-400 font-normal ml-1">Default: {fmt(Number(selectedProduct.selling_price))}</span>
                  )}
                </label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="0"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: sellingPrice ? "#1D9E75" : "#E5E7EB" }}
                />
              </div>

              {sellingPrice && selectedProduct && (selectedProduct.is_serialized ? selectedUnit : true) && (
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ backgroundColor: estimatedProfit >= 0 ? "#E1F5EE" : "#FEE2E2" }}
                >
                  <span className="text-sm font-medium" style={{ color: estimatedProfit >= 0 ? "#0F6E56" : "#DC2626" }}>
                    Estimated profit
                  </span>
                  <span className="text-lg font-bold" style={{ color: estimatedProfit >= 0 ? "#0D3B2E" : "#DC2626" }}>
                    {estimatedProfit >= 0 ? "+" : ""}{fmt(estimatedProfit)}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Customer name (optional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Tunde Bakare"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#E5E7EB" }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Sale date</label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#E5E7EB" }}
                />
              </div>

              {error && (
                <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                  {error}
                </p>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedProductId || !sellingPrice}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#0D3B2E" }}
              >
                {loading ? "Recording sale…" : "Confirm sale"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete sale modal */}
      {showDeleteSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: "#FEE2E2" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Delete this sale?</h2>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">{showDeleteSale.product_name}</span> — {fmt(Number(showDeleteSale.selling_price))}
                </p>
                <p className="text-xs text-gray-400 mt-2">Stock will be restored automatically.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteSale(null)}
                  className="flex-1 h-11 rounded-xl border text-sm font-semibold"
                  style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSale}
                  disabled={deleteLoading}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: "#DC2626" }}
                >
                  {deleteLoading ? "Deleting…" : "Delete sale"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick sale FAB */}
      <button
        onClick={() => setShowSaleForm(true)}
        className="fixed bottom-24 right-5 lg:bottom-8 lg:right-8 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg z-30"
        style={{ backgroundColor: "#0D3B2E", boxShadow: "0 4px 16px rgba(13,59,46,0.4)" }}
        title="Quick sale"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 grid grid-cols-5 z-20"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Sales", href: "/sales", active: true },
          { label: "Reports", href: "/reports" },
          { label: "More", href: "/settings" },
        ].map((item) => (
          
           <a key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center py-3 gap-1"
            style={{ color: item.active ? "#0D3B2E" : "#9CA3AF" }}
          >
            <span className="text-xs font-medium">{item.label}</span>
            {item.active && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "#0D3B2E" }} />}
          </a>
        ))}
      </nav>
    </div>
  );
}