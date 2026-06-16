"use client";

import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

interface PageShellProps {
  storeName: string;
  fullName: string;
  role: string;
  children: ReactNode;
  mainClassName?: string;
}

export default function PageShell({
  storeName,
  fullName,
  role,
  children,
  mainClassName = "flex-1 overflow-y-auto pb-24 lg:pb-0",
}: PageShellProps) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "var(--bg-subtle)" }}
    >
      <Sidebar storeName={storeName} fullName={fullName} role={role} />
      <main className={mainClassName}>{children}</main>
    </div>
  );
}
