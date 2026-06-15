"use client";

import React, { useState } from "react";
import MobileMenuButton from "@/components/MobileMenuButton";

interface Purchase {
  id: string;
  product_name: string;
  brand_name: string | null;
  quantity_sold: number;
  selling_price: number;
  profit: number;
  sold_at: string;
  customer_name: string | null;
  stock_item_id: string | null;
}

interface Customer {
  name: string;
  totalSpend: number;
  totalProfit: number;
  purchases: Purchase[];
  lastPurchase: string;
  purchaseCount: number;
}

interface Profile {
  role: string;
  store_name: string;
  full_name: string;
}

interface Props {
  customers: Customer[];
  profile: Profile;
}

export default function CustomersClient({ customers, profile }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpend, 0);
  const totalTransactions = customers.reduce((sum, c) => sum + c.purchaseCount, 0);

  function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }

  function getCustomerColor(name: string) {
    const colors = [
      { bg: "#E1F5EE", text: "#0F6E56" },
      { bg: "#DBEAFE", text: "#1E3A8A" },
      { bg: "#FEE2E2", text: "#7F1D1D" },
      { bg: "#FFF7ED", text: "#9A3412" },
      { bg: "#F3E8FF", text: "#6B21A8" },
      { bg: "#DCFCE7", text: "#14532D" },
      { bg: "#FEF9C3", text: "#854D0E" },
      { bg: "#FCE7F3", text: "#9D174D" },
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  return (
    <div>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Customers</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalCustomers} customer{totalCustomers !== 1 ? "s" : ""} · {profile.store_name}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total customers", value: String(totalCustomers), color: "#1D9E75" },
            { label: "Total revenue", value: fmt(totalRevenue), color: "#0F6E56" },
            { label: "Transactions", value: String(totalTransactions), color: "#0D3B2E" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4"
              style={{ borderLeft: `4px solid ${stat.color}` }}>
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 h-11 px-3 rounded-xl border bg-white"
          style={{ borderColor: "#E5E7EB" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>

        {/* Customers list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">All customers</h2>
          </div>

          {customers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#E1F5EE" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="#1D9E75" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">No customers yet</p>
              <p className="text-xs text-gray-400">
                Customers appear here when you record sales with a customer name
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400">No customers match your search</p>
            </div>
          ) : (
            <div>
              {filtered.map((customer, i) => {
                const color = getCustomerColor(customer.name);
                return (
                  <div
                    key={customer.name}
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F3F4F6" : "none" }}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: color.bg, color: color.text }}
                      >
                        {getInitials(customer.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {customer.purchaseCount} purchase{customer.purchaseCount !== 1 ? "s" : ""} · Last: {new Date(customer.lastPurchase).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{fmt(customer.totalSpend)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">total spend</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Customer detail modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: getCustomerColor(selectedCustomer.name).bg, color: getCustomerColor(selectedCustomer.name).text }}
                >
                  {getInitials(selectedCustomer.name)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{selectedCustomer.name}</h2>
                  <p className="text-xs text-gray-400">{selectedCustomer.purchaseCount} purchases</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Customer stats */}
            <div className="grid grid-cols-2 gap-3 p-5 border-b border-gray-100">
              <div className="rounded-xl p-3" style={{ backgroundColor: "#E1F5EE" }}>
                <p className="text-xs text-gray-500 mb-1">Total spend</p>
                <p className="text-lg font-bold" style={{ color: "#0D3B2E" }}>{fmt(selectedCustomer.totalSpend)}</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: "#F9FAFB" }}>
                <p className="text-xs text-gray-500 mb-1">Your profit</p>
                <p className="text-lg font-bold" style={{ color: "#16A34A" }}>{fmt(selectedCustomer.totalProfit)}</p>
              </div>
            </div>

            {/* Purchase history */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Purchase history</p>
              </div>
              <div>
                {selectedCustomer.purchases.map((purchase, i) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: i < selectedCustomer.purchases.length - 1 ? "1px solid #F3F4F6" : "none" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#E1F5EE" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 truncate max-w-44">{purchase.product_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(purchase.sold_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{fmt(Number(purchase.selling_price))}</p>
                      <a
                        href={`/receipt?sale=${purchase.id}`}
                        target="_blank"
                        className="text-xs font-medium"
                        style={{ color: "#1D9E75" }}
                      >
                        Receipt →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 grid grid-cols-5 z-20"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Sales", href: "/sales" },
          { label: "Reports", href: "/reports" },
          { label: "More", href: "/settings" },
        ].map((item) => (
          <a key={item.href} href={item.href} className="flex flex-col items-center justify-center py-3 gap-1"
            style={{ color: "#9CA3AF" }}>
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}