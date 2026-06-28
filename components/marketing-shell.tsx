"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicNav } from "@/lib/klario-data";
import { BioIcon } from "@/components/bio-icon";
import { Brand } from "@/components/brand";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navItems = [
    { label: "Home", href: "/", icon: "icon_tab_dashboard" },
    ...publicNav.map((item) => ({ ...item, icon: item.href === "/about" ? "icon_family_header" : "icon_signal_insights" })),
    { label: "App", href: "/app/dashboard", icon: "icon_doc_import_panel" }
  ];

  return (
    <>
      <header className="site-header floating-glass-nav">
        <nav className="navbar" aria-label="Main navigation">
          <div className="nav-left">
            <Brand />
            {navItems.map((item) => (
              <Link key={item.href} className={`nav-link${pathname === item.href ? " is-active" : ""}`} href={item.href} title={item.label}>
                <BioIcon name={item.icon} size={17} />
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="nav-right">
            <Link className={`button button-primary nav-action${pathname === "/login" ? " is-active" : ""}`} href="/login" title="Try for free">
              <BioIcon name="icon_action_continue" size={17} />
              <span className="nav-label">Try for free</span>
            </Link>
          </div>
        </nav>
      </header>
      {children}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Brand />
            <p>Medical report tracking that turns scattered lab results into clear timelines, trends, and family health insights.</p>
          </div>
          <div>
            <p className="footer-heading">Product</p>
            <ul className="footer-links">
              <li><Link href="/features">Features</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/login">Try for free</Link></li>
            </ul>
          </div>
          <div>
            <p className="footer-heading">Workspace</p>
            <ul className="footer-links">
              <li><Link href="/app/dashboard">Web app</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>(c) 2026 Klario. For organization and education - not a substitute for professional medical advice.</p>
        </div>
      </footer>
    </>
  );
}
