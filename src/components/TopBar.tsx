"use client";

import React from "react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onMenuClick: () => void;
}

export default function TopBar({ title, subtitle, right, onMenuClick }: TopBarProps) {
  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 py-4 border-b"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ backgroundColor: "var(--brand-primary)", color: "#fff" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{title}</h1>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
        </div>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}