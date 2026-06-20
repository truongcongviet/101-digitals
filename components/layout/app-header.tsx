"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Plus } from "lucide-react";

export function AppHeader() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" href="/">
          <span className="brand-mark">SI</span>
          <span>SimpleInvoice</span>
        </Link>
        <div className="nav-actions">
          <Link className="button button-primary" href="/invoices/new">
            <Plus size={17} aria-hidden="true" />
            New invoice
          </Link>
          <button className="button button-secondary" type="button" onClick={handleLogout}>
            <LogOut size={17} aria-hidden="true" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
