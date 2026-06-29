"use client";

import { MouseEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicNav } from "@/lib/klario-data";
import { Brand } from "@/components/brand";
import { NavIcon, type NavIconName } from "@/components/nav-icon";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [homeNavActive, setHomeNavActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems: Array<{ label: string; href: string; icon: NavIconName }> = [
    { label: "Home", href: "/#cascade", icon: "home" },
    ...publicNav.map((item) => ({ ...item, icon: item.href === "/about" ? "info" as const : "sparkles" as const })),
    { label: "App", href: "/app/dashboard", icon: "app" }
  ];

  useEffect(() => {
    setMenuOpen(false);

    if (pathname !== "/") {
      setHomeNavActive(false);
      return;
    }

    const updateHomeState = () => {
      const cascade = document.getElementById("cascade");
      setHomeNavActive(Boolean(cascade && cascade.getBoundingClientRect().top <= 120));
    };

    updateHomeState();
    window.addEventListener("scroll", updateHomeState, { passive: true });
    window.addEventListener("resize", updateHomeState);
    window.addEventListener("hashchange", updateHomeState);

    return () => {
      window.removeEventListener("scroll", updateHomeState);
      window.removeEventListener("resize", updateHomeState);
      window.removeEventListener("hashchange", updateHomeState);
    };
  }, [pathname]);

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    setMenuOpen(false);

    if (pathname !== "/") return;

    event.preventDefault();
    window.history.replaceState(null, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setHomeNavActive(false);
  };

  return (
    <>
      <header className={`site-header floating-glass-nav${menuOpen ? " is-mobile-open" : ""}`}>
        <nav className="navbar" aria-label="Main navigation">
          <div className="mobile-nav-head">
            <Brand onClick={handleLogoClick} />
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
          <div className="nav-left">
            <Brand onClick={handleLogoClick} />
            {navItems.map((item) => {
              const isActive = item.href === "/#cascade" ? pathname === "/" && homeNavActive : pathname === item.href;

              return (
                <Link key={item.href} className={`nav-link${isActive ? " is-active" : ""}`} href={item.href} title={item.label} onClick={() => setMenuOpen(false)}>
                  <NavIcon name={item.icon} size={17} />
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="nav-right">
            <Link className={`button button-primary nav-action${pathname === "/login" ? " is-active" : ""}`} href="/login" title="Try for free" onClick={() => setMenuOpen(false)}>
              <NavIcon name="arrow" size={17} />
              <span className="nav-label">Try for free</span>
            </Link>
          </div>
        </nav>
      </header>
      {children}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Brand onClick={handleLogoClick} />
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
