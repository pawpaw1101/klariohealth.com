"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { appNav } from "@/lib/klario-data";
import { Brand } from "@/components/brand";
import { NavIcon, type NavIconName } from "@/components/nav-icon";
import { useKlarioApi } from "@/components/klario-api-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useKlarioApi();
  const [menuOpen, setMenuOpen] = useState(false);
  const navIcons: Record<string, NavIconName> = {
    "/app/dashboard": "dashboard",
    "/app/documents": "documents",
    "/app/upload": "upload",
    "/app/trends": "trends",
    "/app/family": "family"
  };

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <header className={`site-header${menuOpen ? " is-mobile-open" : ""}`}>
        <nav className="navbar" aria-label="App navigation">
          <div className="mobile-nav-head">
            <Brand href="/app/dashboard" />
            <button
              className="mobile-nav-toggle"
              type="button"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setMenuOpen((current) => !current)}
            >
              <NavIcon name={menuOpen ? "close" : "menu"} size={20} />
            </button>
          </div>
          <div className="app-nav">
            <Brand href="/app/dashboard" />
            {appNav.map((item) => (
              <Link key={item.href} className={`nav-link${pathname === item.href ? " is-active" : ""}`} href={item.href} title={item.label} onClick={() => setMenuOpen(false)}>
                <NavIcon name={navIcons[item.href]} size={17} />
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="nav-right">
            <Link className={`nav-link${pathname === "/app/account" ? " is-active" : ""}`} href="/app/account" title="Profile" onClick={() => setMenuOpen(false)}>
              <NavIcon name="user" size={17} />
              <span className="nav-label">Profile</span>
            </Link>
            <Link className={`nav-link${pathname === "/app/settings" ? " is-active" : ""}`} href="/app/settings" title="Settings" onClick={() => setMenuOpen(false)}>
              <NavIcon name="gear" size={17} />
              <span className="nav-label">Settings</span>
            </Link>
            <button
              className="button button-ghost nav-action"
              type="button"
              title="Log out"
              onClick={() => {
                setMenuOpen(false);
                logout();
                router.push("/login");
              }}
            >
              <NavIcon name="logout" size={17} />
              <span className="nav-label">Log out</span>
            </button>
          </div>
        </nav>
      </header>
      <main className="app-shell app-cascade-shell">{children}</main>
    </>
  );
}
