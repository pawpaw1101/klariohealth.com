"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { appNav } from "@/lib/klario-data";
import { Brand } from "@/components/brand";
import { BioIcon } from "@/components/bio-icon";
import { NavIcon } from "@/components/nav-icon";
import { useKlarioApi } from "@/components/klario-api-provider";
import type { KlarioIconName } from "@/lib/icons";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { backendLogout } = useKlarioApi();
  const [menuOpen, setMenuOpen] = useState(false);
  const navIcons: Record<string, KlarioIconName> = {
    "/app/dashboard": "icon_tab_dashboard",
    "/app/trends": "icon_tab_trends",
    "/app/reports": "icon_tab_documents",
    "/app/family": "icon_tab_family",
    "/app/settings": "icon_tab_settings"
  };
  const isActiveRoute = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

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
              <Link key={item.href} className={`nav-link${isActiveRoute(item.href) ? " is-active" : ""}`} href={item.href} title={item.label} onClick={() => setMenuOpen(false)}>
                <BioIcon name={navIcons[item.href]} size={24} />
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="nav-right">
            <button
              className="button button-ghost nav-action"
              type="button"
              title="Log out"
              onClick={() => {
                setMenuOpen(false);
                void backendLogout().finally(() => router.push("/login"));
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
