"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNav } from "@/lib/klario-data";
import { BioIcon } from "@/components/bio-icon";
import { Brand } from "@/components/brand";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navIcons: Record<string, string> = {
    "/app/dashboard": "icon_tab_dashboard",
    "/app/documents": "icon_tab_documents",
    "/app/upload": "icon_doc_add_empty",
    "/app/timeline": "icon_timeline_empty",
    "/app/trends": "icon_tab_trends",
    "/app/family": "icon_tab_family"
  };

  return (
    <>
      <header className="site-header floating-glass-nav app-floating-nav">
        <nav className="navbar" aria-label="App navigation">
          <div className="app-nav">
            <Brand href="/app/dashboard" />
            {appNav.map((item) => (
              <Link key={item.href} className={`nav-link${pathname === item.href ? " is-active" : ""}`} href={item.href} title={item.label}>
                <BioIcon name={navIcons[item.href]} size={17} />
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="nav-right">
            <Link className={`nav-link${pathname === "/app/account" ? " is-active" : ""}`} href="/app/account" title="Profile">
              <BioIcon name="icon_family_header" size={17} />
              <span className="nav-label">Profile</span>
            </Link>
            <Link className={`nav-link${pathname === "/app/settings" ? " is-active" : ""}`} href="/app/settings" title="Settings">
              <BioIcon name="icon_filter_status" size={17} />
              <span className="nav-label">Settings</span>
            </Link>
            <Link className="button button-ghost nav-action" href="/" title="Log out">
              <BioIcon name="icon_action_continue" size={17} />
              <span className="nav-label">Log out</span>
            </Link>
          </div>
        </nav>
      </header>
      <main className="app-shell">{children}</main>
    </>
  );
}
