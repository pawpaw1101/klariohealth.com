"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNav } from "@/lib/klario-data";
import { Brand } from "@/components/brand";
import { NavIcon, type NavIconName } from "@/components/nav-icon";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navIcons: Record<string, NavIconName> = {
    "/app/dashboard": "dashboard",
    "/app/documents": "documents",
    "/app/upload": "upload",
    "/app/timeline": "calendar",
    "/app/trends": "trends",
    "/app/family": "family"
  };

  return (
    <>
      <header className="site-header floating-glass-nav app-floating-nav">
        <nav className="navbar" aria-label="App navigation">
          <div className="app-nav">
            <Brand href="/app/dashboard" />
            {appNav.map((item) => (
              <Link key={item.href} className={`nav-link${pathname === item.href ? " is-active" : ""}`} href={item.href} title={item.label}>
                <NavIcon name={navIcons[item.href]} size={17} />
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="nav-right">
            <Link className={`nav-link${pathname === "/app/account" ? " is-active" : ""}`} href="/app/account" title="Profile">
              <NavIcon name="user" size={17} />
              <span className="nav-label">Profile</span>
            </Link>
            <Link className={`nav-link${pathname === "/app/settings" ? " is-active" : ""}`} href="/app/settings" title="Settings">
              <NavIcon name="gear" size={17} />
              <span className="nav-label">Settings</span>
            </Link>
            <Link className="button button-ghost nav-action" href="/" title="Log out">
              <NavIcon name="logout" size={17} />
              <span className="nav-label">Log out</span>
            </Link>
          </div>
        </nav>
      </header>
      <main className="app-shell">{children}</main>
    </>
  );
}
