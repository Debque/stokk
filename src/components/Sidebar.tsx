"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const navItems = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "inventory", label: "Inventory", href: "/inventory" },
  { icon: "sales", label: "Sales", href: "/sales" },
];

const financeItems = [
  { icon: "reports", label: "Reports", href: "/reports" },
  { icon: "expenses", label: "Expenses", href: "/expenses" },
  { icon: "customers", label: "Customers", href: "/customers" },
];

const stockItems = [
  { icon: "imei", label: "IMEI Tracker", href: "/imei" },
  { icon: "adjustments", label: "Adjustments", href: "/adjustments" },
  { icon: "suppliers", label: "Suppliers", href: "/suppliers" },
];

const settingsItems = [
  { icon: "team", label: "Team", href: "/team" },
  { icon: "settings", label: "Settings", href: "/settings" },
];

const attendantStockItems = [
  { icon: "imei", label: "IMEI Tracker", href: "/imei" },
];

const attendantSettingsItems = [
  { icon: "settings", label: "Settings", href: "/settings" },
];

function NavIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactElement> = {
    dashboard: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.4" />
      </svg>
    ),
    inventory: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    sales: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    reports: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    expenses: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M1 10h22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    customers: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    imei: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 18h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    adjustments: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="9" cy="6" r="2" fill="currentColor"/>
        <circle cx="15" cy="12" r="2" fill="currentColor"/>
        <circle cx="9" cy="18" r="2" fill="currentColor"/>
      </svg>
    ),
    suppliers: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    team: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    settings: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    chevron_left: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    chevron_right: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    logout: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  };
  return icons[icon] || null;
}

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  collapsed: boolean;
  isActive: boolean;
  onNavigate: (href: string) => void;
  onTooltipShow: (label: string) => void;
  onTooltipHide: () => void;
  tooltip: string | null;
  onMobileClose: () => void;
}

function NavItem({
  href, icon, label, collapsed, isActive,
  onNavigate, onTooltipShow, onTooltipHide, tooltip, onMobileClose,
}: NavItemProps) {
  return (
    <div className="relative">
      <button
        onClick={() => { onNavigate(href); onMobileClose(); }}
        onMouseEnter={() => collapsed && onTooltipShow(label)}
        onMouseLeave={onTooltipHide}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left"
        style={{
          backgroundColor: isActive ? "rgba(255,255,255,0.12)" : "transparent",
          borderLeft: isActive ? "3px solid #5DCAA5" : "3px solid transparent",
          color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
        }}
      >
        <span className="flex-shrink-0" style={{ color: isActive ? "#5DCAA5" : "rgba(255,255,255,0.6)" }}>
          <NavIcon icon={icon} />
        </span>
        {!collapsed && (
          <span className="text-sm font-medium truncate">{label}</span>
        )}
      </button>

      {collapsed && tooltip === label && (
        <div
          className="absolute left-14 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap pointer-events-none"
          style={{ backgroundColor: "#0F6E56", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
        >
          {label}
          <div
            className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
            style={{ borderRightColor: "#0F6E56" }}
          />
        </div>
      )}
    </div>
  );
}

interface SectionLabelProps {
  label: string;
  collapsed: boolean;
}

function SectionLabel({ label, collapsed }: SectionLabelProps) {
  if (collapsed) {
    return <div className="my-1 mx-3 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />;
  }
  return (
    <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
      {label}
    </p>
  );
}

interface SidebarProps {
  storeName: string;
  fullName: string;
  role: string;
}

export default function Sidebar({ storeName, fullName, role }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const key = `stokk_sidebar_collapsed_${role}`;
      const saved = localStorage.getItem(key) === "true";
      setCollapsed(saved);

      // Restore dark mode preference (controlled from Settings)
      const darkSaved = localStorage.getItem("stokk_dark_mode") === "true";
      if (darkSaved) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [role]);

  useEffect(() => {
    const handler = () => setMobileOpen(true);
    window.addEventListener("stokk:open-sidebar", handler);
    return () => window.removeEventListener("stokk:open-sidebar", handler);
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(`stokk_sidebar_collapsed_${role}`, String(next));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const allNavSections = role === "owner"
    ? [
        { items: navItems, section: null },
        { items: financeItems, section: "Finance" },
        { items: stockItems, section: "Stock" },
        { items: settingsItems, section: "Settings" },
      ]
    : [
        { items: navItems, section: null },
        { items: attendantStockItems, section: "Stock" },
        { items: attendantSettingsItems, section: "Settings" },
      ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          "flex flex-col h-screen transition-all duration-200 flex-shrink-0",
          "fixed lg:sticky top-0 left-0 z-50",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
        style={{
          width: mounted ? (collapsed ? "64px" : "210px") : "210px",
          backgroundColor: "#0D3B2E",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="#5DCAA5" />
              <rect x="13" y="3" width="8" height="8" rx="2" fill="#5DCAA5" opacity="0.6" />
              <rect x="3" y="13" width="8" height="8" rx="2" fill="#5DCAA5" opacity="0.6" />
              <rect x="13" y="13" width="8" height="8" rx="2" fill="#5DCAA5" opacity="0.3" />
            </svg>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-white text-sm font-bold tracking-tight">Stokk</div>
              <div className="text-xs truncate" style={{ color: "#5DCAA5" }}>{storeName}</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {allNavSections.map(({ items, section }) => (
            <React.Fragment key={section ?? "main"}>
              {section && <SectionLabel label={section} collapsed={collapsed} />}
              {items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  collapsed={collapsed}
                  isActive={pathname === item.href}
                  onNavigate={(href) => router.push(href)}
                  onTooltipShow={(label) => setTooltip(label)}
                  onTooltipHide={() => setTooltip(null)}
                  tooltip={tooltip}
                  onMobileClose={() => setMobileOpen(false)}
                />
              ))}
            </React.Fragment>
          ))}
        </nav>

        {/* User + toggle */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="px-3 py-3 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
              style={{ backgroundColor: "#1D9E75" }}
            >
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">{fullName}</p>
                  <p className="text-xs capitalize truncate" style={{ color: "rgba(255,255,255,0.65)" }}>
                    {role}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex-shrink-0 p-1.5 rounded-lg transition hover:opacity-80"
                  style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.1)" }}
                  title="Sign out"
                >
                  <NavIcon icon="logout" />
                </button>
              </>
            )}
          </div>

          <button
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center py-3 transition hover:opacity-80"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <NavIcon icon={collapsed ? "chevron_right" : "chevron_left"} />
          </button>
        </div>
      </aside>
    </>
  );
}