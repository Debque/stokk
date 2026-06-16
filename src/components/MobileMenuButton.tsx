"use client";

export default function MobileMenuButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("stokk:open-sidebar"))}
      className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
      style={{ backgroundColor: "var(--brand-primary)", color: "#fff" }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  );
}