"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import MobileMenuButton from "@/components/MobileMenuButton";

interface Brand {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  brand_id: string | null;
  category: string;
  is_serialized: boolean;
  cost_price: number;
  selling_price: number;
  quantity: number;
  minimum_stock: number;
  image_url: string | null;
  currentStock: number;
}

interface Profile {
  role: string;
  store_name: string;
  full_name: string;
}

interface Props {
  brands: Brand[];
  products: Product[];
  profile: Profile;
}

const CATEGORIES = [
  "Smartphones",
  "Smart Watches",
  "Chargers",
  "Phone Cases",
  "Earphones",
  "Power Banks",
  "Bluetooth Speakers",
  "Screen Protectors",
  "Other",
];

const colorPalette = [
  { bg: "#E1F5EE", text: "#0F6E56" },
  { bg: "#DBEAFE", text: "#1E3A8A" },
  { bg: "#FEE2E2", text: "#7F1D1D" },
  { bg: "#FFF7ED", text: "#9A3412" },
  { bg: "#F3E8FF", text: "#6B21A8" },
  { bg: "#DCFCE7", text: "#14532D" },
  { bg: "#FEF9C3", text: "#854D0E" },
  { bg: "#FCE7F3", text: "#9D174D" },
];

function getBrandColor(index: number) {
  return colorPalette[index % colorPalette.length];
}

export default function InventoryClient({ brands, products, profile }: Props) {
  const router = useRouter();
  const isOwner = profile.role === "owner";

  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [showProducts, setShowProducts] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "out">("all");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [showEditBrandSuggestions, setShowEditBrandSuggestions] = useState(false);

  const [form, setForm] = useState({
    name: "",
    brandName: "",
    brandId: "",
    category: "Smartphones",
    isSerialized: true,
    costPrice: "",
    sellingPrice: "",
    minimumStock: "5",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    brandName: "",
    brandId: "",
    category: "Smartphones",
    costPrice: "",
    sellingPrice: "",
    minimumStock: "5",
  });

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedBrandId && p.brand_id !== selectedBrandId) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus === "low" && !(p.currentStock > 0 && p.currentStock <= p.minimum_stock)) return false;
      if (filterStatus === "out" && p.currentStock !== 0) return false;
      return true;
    });
  }, [products, selectedBrandId, search, filterStatus]);

  const brandStats = useMemo(() => {
    const map: Record<string, { units: number; value: number; models: number }> = {};
    products.forEach((p) => {
      if (!p.brand_id) return;
      if (!map[p.brand_id]) map[p.brand_id] = { units: 0, value: 0, models: 0 };
      map[p.brand_id].units += p.currentStock;
      map[p.brand_id].value += p.currentStock * Number(p.cost_price);
      map[p.brand_id].models += 1;
    });
    return map;
  }, [products]);

  const brandSuggestions = brands.filter((b) =>
    b.name.toLowerCase().includes(form.brandName.toLowerCase()) && form.brandName.length > 0
  );

  const editBrandSuggestions = brands.filter((b) =>
    b.name.toLowerCase().includes(editForm.brandName.toLowerCase()) && editForm.brandName.length > 0
  );

  const lowStockCount = products.filter(
    (p) => p.currentStock > 0 && p.currentStock <= p.minimum_stock
  ).length;

  const totalProducts = products.length;

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
  const fmtShort = (n: number) =>
    n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `₦${(n / 1_000).toFixed(0)}K`
    : `₦${n}`;

  async function handleAddProduct() {
    if (!form.name || !form.brandName || !form.sellingPrice) {
      setError("Product name, brand, and selling price are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let brandId = form.brandId;
      if (!brandId) {
        const { data: existingBrand } = await supabase
          .from("brands").select("id").ilike("name", form.brandName).single();
        if (existingBrand) {
          brandId = existingBrand.id;
        } else {
          const { data: newBrand, error: brandError } = await supabase
            .from("brands").insert({ name: form.brandName.trim() }).select("id").single();
          if (brandError) throw brandError;
          brandId = newBrand.id;
        }
      }
      const { error: productError } = await supabase.from("products").insert({
        name: form.name.trim(),
        brand_id: brandId,
        category: form.category,
        is_serialized: form.isSerialized,
        cost_price: Number(form.costPrice) || 0,
        selling_price: Number(form.sellingPrice),
        quantity: 0,
        minimum_stock: Number(form.minimumStock) || 5,
      });
      if (productError) throw productError;
      setForm({ name: "", brandName: "", brandId: "", category: "Smartphones", isSerialized: true, costPrice: "", sellingPrice: "", minimumStock: "5" });
      setShowAddProduct(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(product: Product) {
    const brandName = brands.find((b) => b.id === product.brand_id)?.name ?? "";
    setEditForm({
      name: product.name,
      brandName,
      brandId: product.brand_id ?? "",
      category: product.category,
      costPrice: String(product.cost_price),
      sellingPrice: String(product.selling_price),
      minimumStock: String(product.minimum_stock),
    });
    setShowEditProduct(product);
    setError(null);
  }

  async function handleEditProduct() {
    if (!editForm.name || !editForm.brandName || !editForm.sellingPrice) {
      setError("Product name, brand, and selling price are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let brandId = editForm.brandId;
      if (!brandId || !brands.find((b) => b.id === brandId && b.name.toLowerCase() === editForm.brandName.toLowerCase())) {
        const { data: existingBrand } = await supabase
          .from("brands").select("id").ilike("name", editForm.brandName).single();
        if (existingBrand) {
          brandId = existingBrand.id;
        } else {
          const { data: newBrand, error: brandError } = await supabase
            .from("brands").insert({ name: editForm.brandName.trim() }).select("id").single();
          if (brandError) throw brandError;
          brandId = newBrand.id;
        }
      }
      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: editForm.name.trim(),
          brand_id: brandId,
          category: editForm.category,
          cost_price: Number(editForm.costPrice) || 0,
          selling_price: Number(editForm.sellingPrice),
          minimum_stock: Number(editForm.minimumStock) || 5,
        })
        .eq("id", showEditProduct!.id);
      if (updateError) throw updateError;
      setShowEditProduct(null);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProduct() {
    if (!showDeleteConfirm) return;
    setDeleteLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from("products")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", showDeleteConfirm.id);
      if (deleteError) throw deleteError;
      setShowDeleteConfirm(null);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, productId: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("Image must be under 4MB.");
      return;
    }
   setUploadingId(productId);
    const timestamp = new Date().getTime();
    try {
      const ext = file.name.split(".").pop();
      const filename = `${productId}-${timestamp}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filename, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filename);
      const { error: updateError } = await supabase
        .from("products")
        .update({ image_url: publicUrl })
        .eq("id", productId);
      if (updateError) throw updateError;
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingId(null);
    }
  }

  const selectedBrandName = brands.find((b) => b.id === selectedBrandId)?.name;

  return (
    <div>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Inventory</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalProducts} product{totalProducts !== 1 ? "s" : ""} · {brands.length} brand{brands.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowAddProduct(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#0D3B2E" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Add product
          </button>
        )}
      </div>

      <div className="p-4 lg:p-6 space-y-5">

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-2 flex-1 min-w-48 h-10 px-3 rounded-xl border bg-white"
            style={{ borderColor: "#E5E7EB" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); if (e.target.value) setShowProducts(true); }}
              placeholder="Search products..."
              className="flex-1 text-sm outline-none bg-transparent"
            />
          </div>

          {["all", "low", "out"].map((status) => (
            <button
              key={status}
              onClick={() => {
                if (filterStatus === status && showProducts && !selectedBrandId) {
                  setShowProducts(false);
                } else {
                  setFilterStatus(status as "all" | "low" | "out");
                  setShowProducts(true);
                  setSelectedBrandId(null);
                }
              }}
              className="h-10 px-4 rounded-xl text-sm font-medium border transition"
              style={{
                backgroundColor: filterStatus === status && showProducts && !selectedBrandId
                  ? status === "low" ? "#FFF7ED" : status === "out" ? "#FEE2E2" : "#E1F5EE" : "#fff",
                borderColor: filterStatus === status && showProducts && !selectedBrandId
                  ? status === "low" ? "#FED7AA" : status === "out" ? "#FCA5A5" : "#5DCAA5" : "#E5E7EB",
                color: filterStatus === status && showProducts && !selectedBrandId
                  ? status === "low" ? "#9A3412" : status === "out" ? "#7F1D1D" : "#0F6E56" : "#6B7280",
              }}
            >
              {status === "all" ? `All (${products.length})` : status === "low" ? `Low stock (${lowStockCount})` : "Out of stock"}
            </button>
          ))}
        </div>

        {/* Brand cards */}
        {brands.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {brands.map((brand, i) => {
              const stats = brandStats[brand.id] ?? { units: 0, value: 0, models: 0 };
              const color = getBrandColor(i);
              const isSelected = selectedBrandId === brand.id;
              return (
                <button
                  key={brand.id}
                  onClick={() => {
                    if (isSelected) { setSelectedBrandId(null); setShowProducts(false); }
                    else { setSelectedBrandId(brand.id); setShowProducts(true); setFilterStatus("all"); }
                  }}
                  className="text-left p-4 rounded-2xl border-2 transition"
                  style={{ borderColor: isSelected ? "#1D9E75" : "#F3F4F6", backgroundColor: isSelected ? "#F0FAF6" : "#fff" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold mb-3"
                    style={{ backgroundColor: color.bg, color: color.text }}>
                    {brand.name[0].toUpperCase()}
                  </div>
                  <div className="text-sm font-bold text-gray-900 mb-1">{brand.name}</div>
                  <div className="text-xs font-semibold" style={{ color: "#1D9E75" }}>
                    {stats.units} unit{stats.units !== 1 ? "s" : ""} in stock
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {stats.models} model{stats.models !== 1 ? "s" : ""} · {fmtShort(stats.value)} value
                  </div>
                  <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#F3F4F6" }}>
                    <div className="h-full rounded-full" style={{ backgroundColor: isSelected ? "#1D9E75" : color.text, width: "100%" }}/>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected brand label */}
        {selectedBrandId && selectedBrandName && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {selectedBrandName} — {filtered.length} model{filtered.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => { setSelectedBrandId(null); setShowProducts(false); }}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "#6B7280" }}
            >
              Clear
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* Product grid */}
        {!showProducts && !search ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#E1F5EE" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {products.length === 0 ? "No products yet" : "Select a brand or filter to view products"}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              {products.length === 0 ? "Add your first product to get started" : "Click any brand card above or use the filters to browse your inventory"}
            </p>
            {products.length === 0 && isOwner && (
              <button onClick={() => setShowAddProduct(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#0D3B2E" }}>
                Add first product
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-sm font-semibold text-gray-900 mb-1">No products match your filter</p>
            <p className="text-xs text-gray-400">Try changing your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((product) => {
              const brandIndex = brands.findIndex((b) => b.id === product.brand_id);
              const color = getBrandColor(brandIndex >= 0 ? brandIndex : 0);
              const isLow = product.currentStock > 0 && product.currentStock <= product.minimum_stock;
              const isOut = product.currentStock === 0;
              const brandName = brands.find((b) => b.id === product.brand_id)?.name ?? "";

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border overflow-hidden"
                  style={{ borderColor: isLow || isOut ? "#FED7AA" : "#F3F4F6" }}
                >
                  {/* Image area with hover upload */}
                  <div
                    className="h-24 relative flex items-center justify-center text-3xl font-bold overflow-hidden group"
                    style={{
                      backgroundColor: isOut ? "#FEE2E2" : isLow ? "#FFF7ED" : color.bg,
                      color: isOut ? "#DC2626" : isLow ? "#F97316" : color.text,
                    }}
                  >
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill className="object-cover"/>
                    ) : (
                      product.name[0].toUpperCase()
                    )}
                    {isOwner && (
                      <label
                        className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2"/>
                          </svg>
                          <span className="text-xs text-white font-medium">
                            {uploadingId === product.id ? "Uploading…" : "Change photo"}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, product.id)}
                          disabled={uploadingId === product.id}
                        />
                      </label>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="mb-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{brandName} · {product.category}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-base font-bold" style={{ color: "#0F6E56" }}>
                        {fmt(Number(product.selling_price))}
                      </span>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: isOut ? "#FEE2E2" : isLow ? "#FFF7ED" : "#E1F5EE",
                          color: isOut ? "#DC2626" : isLow ? "#9A3412" : "#0F6E56",
                        }}
                      >
                        {isOut ? "Out of stock" : isLow ? `${product.currentStock} left` : `${product.currentStock} in stock`}
                      </span>
                    </div>

                    {isLow && (
                      <p className="text-xs mt-1.5" style={{ color: "#C2410C" }}>
                        Min: {product.minimum_stock} · Restock needed
                      </p>
                    )}

                    <div className="flex gap-2 mt-4">
                      {isOwner && (
                        <button
                          onClick={() => openEditModal(product)}
                          className="h-9 px-3 rounded-xl border text-xs font-semibold transition"
                          style={{ borderColor: "#E5E7EB", color: "#374151" }}
                        >
                          Edit
                        </button>
                      )}
                      {product.is_serialized && (
                        <button
                          onClick={() => router.push(`/imei?product=${product.id}`)}
                          className="flex-1 h-9 rounded-xl border text-xs font-semibold transition"
                          style={{ borderColor: "#E5E7EB", color: "#374151" }}
                        >
                          IMEIs
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/inventory/stock?product=${product.id}`)}
                        className="flex-1 h-9 rounded-xl text-xs font-semibold text-white transition"
                        style={{ backgroundColor: "#0D3B2E" }}
                      >
                        {isOut || isLow ? "+ Restock" : "+ Stock"}
                      </button>
                    </div>

                    {isOwner && (
                      <button
                        onClick={() => setShowDeleteConfirm(product)}
                        className="w-full mt-2 h-8 rounded-xl text-xs font-medium transition"
                        style={{ color: "#DC2626", backgroundColor: "#FFF5F5" }}
                      >
                        Delete product
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add product modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Add new product</h2>
              <button onClick={() => { setShowAddProduct(false); setError(null); }} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: "#6B7280" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Product name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. iPhone 15 Pro" className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: form.name ? "#1D9E75" : "#E5E7EB" }}/>
              </div>
              <div className="space-y-1.5 relative">
                <label className="text-sm font-medium text-gray-700">Brand</label>
                <input
                  type="text" value={form.brandName}
                  onChange={(e) => { setForm({ ...form, brandName: e.target.value, brandId: "" }); setShowBrandSuggestions(true); }}
                  onFocus={() => setShowBrandSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 150)}
                  placeholder="e.g. Apple, Tecno, Samsung"
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: form.brandName ? "#1D9E75" : "#E5E7EB" }}
                />
                {showBrandSuggestions && brandSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10 overflow-hidden">
                    {brandSuggestions.map((b) => (
                      <button key={b.id} onMouseDown={() => { setForm({ ...form, brandName: b.name, brandId: b.id }); setShowBrandSuggestions(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition" style={{ color: "#374151" }}>{b.name}</button>
                    ))}
                  </div>
                )}
                {form.brandName && !form.brandId && <p className="text-xs" style={{ color: "#0F6E56" }}>New brand &quot;{form.brandName}&quot; will be created</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select value={form.category} onChange={(e) => { const cat = e.target.value; setForm({ ...form, category: cat, isSerialized: cat === "Smartphones" || cat === "Smart Watches" }); }} className="w-full h-11 px-3 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E5E7EB" }}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ backgroundColor: "#F9FAFB" }}>
                <div>
                  <p className="text-sm font-medium text-gray-900">Track by IMEI</p>
                  <p className="text-xs text-gray-500 mt-0.5">{form.isSerialized ? "Each unit tracked individually" : "Tracked by quantity"}</p>
                </div>
                <button onClick={() => setForm({ ...form, isSerialized: !form.isSerialized })} className="w-11 h-6 rounded-full transition-all relative" style={{ backgroundColor: form.isSerialized ? "#1D9E75" : "#D1D5DB" }}>
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: form.isSerialized ? "22px" : "2px" }}/>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Cost price (₦)</label>
                  <input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="0" className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: "#E5E7EB" }}/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Selling price (₦)</label>
                  <input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} placeholder="0" className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: form.sellingPrice ? "#1D9E75" : "#E5E7EB" }}/>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Minimum stock threshold</label>
                <input type="number" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} placeholder="5" className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: "#E5E7EB" }}/>
                <p className="text-xs text-gray-400">You&apos;ll get a low stock alert when stock falls below this number</p>
              </div>
              {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>{error}</p>}
              <button onClick={handleAddProduct} disabled={loading || !form.name || !form.brandName || !form.sellingPrice} className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: "#0D3B2E" }}>
                {loading ? "Adding product…" : "Add product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit product modal */}
      {showEditProduct && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Edit product</h2>
              <button onClick={() => { setShowEditProduct(null); setError(null); }} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: "#6B7280" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Product name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: editForm.name ? "#1D9E75" : "#E5E7EB" }}/>
              </div>
              <div className="space-y-1.5 relative">
                <label className="text-sm font-medium text-gray-700">Brand</label>
                <input
                  type="text" value={editForm.brandName}
                  onChange={(e) => { setEditForm({ ...editForm, brandName: e.target.value, brandId: "" }); setShowEditBrandSuggestions(true); }}
                  onFocus={() => setShowEditBrandSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowEditBrandSuggestions(false), 150)}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: editForm.brandName ? "#1D9E75" : "#E5E7EB" }}
                />
                {showEditBrandSuggestions && editBrandSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10 overflow-hidden">
                    {editBrandSuggestions.map((b) => (
                      <button key={b.id} onMouseDown={() => { setEditForm({ ...editForm, brandName: b.name, brandId: b.id }); setShowEditBrandSuggestions(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition" style={{ color: "#374151" }}>{b.name}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="w-full h-11 px-3 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E5E7EB" }}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Cost price (₦)</label>
                  <input type="number" value={editForm.costPrice} onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })} className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: "#E5E7EB" }}/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Selling price (₦)</label>
                  <input type="number" value={editForm.sellingPrice} onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })} className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: editForm.sellingPrice ? "#1D9E75" : "#E5E7EB" }}/>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Minimum stock threshold</label>
                <input type="number" value={editForm.minimumStock} onChange={(e) => setEditForm({ ...editForm, minimumStock: e.target.value })} className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: "#E5E7EB" }}/>
              </div>
              {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>{error}</p>}
              <button onClick={handleEditProduct} disabled={loading || !editForm.name || !editForm.brandName || !editForm.sellingPrice} className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: "#0D3B2E" }}>
                {loading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "#FEE2E2" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Delete {showDeleteConfirm.name}?</h2>
                <p className="text-sm text-gray-500">This product will be removed from your inventory. Sales history will be preserved.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 h-11 rounded-xl border text-sm font-semibold" style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>Cancel</button>
                <button onClick={handleDeleteProduct} disabled={deleteLoading} className="flex-1 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#DC2626" }}>
                  {deleteLoading ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 grid grid-cols-5 z-20" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory", active: true },
          { label: "Sales", href: "/sales" },
          { label: "Reports", href: "/reports" },
          { label: "More", href: "/settings" },
        ].map((item) => (
          <a key={item.href} href={item.href} className="flex flex-col items-center justify-center py-3 gap-1" style={{ color: item.active ? "#0D3B2E" : "#9CA3AF" }}>
            <span className="text-xs font-medium">{item.label}</span>
            {item.active && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "#0D3B2E" }}/>}
          </a>
        ))}
      </nav>
    </div>
  );
}