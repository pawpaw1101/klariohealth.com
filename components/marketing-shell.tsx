"use client";

import { MouseEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { NavIcon, type NavIconName } from "@/components/nav-icon";

type MarketingNavKey = "home" | "product" | "about";

const navItems: Array<{ key: MarketingNavKey; label: string; href: string; icon: NavIconName }> = [
  { key: "home", label: "Home", href: "/", icon: "home" },
  { key: "product", label: "Product", href: "/features", icon: "product" },
  { key: "about", label: "About", href: "/about", icon: "info" }
];

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [homeNavActive, setHomeNavActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);

  useEffect(() => {
    setMenuOpen(false);

    const updateNavState = () => {
      setNavCollapsed(window.scrollY > 48);
    };

    updateNavState();
    window.addEventListener("scroll", updateNavState, { passive: true });
    window.addEventListener("resize", updateNavState);

    if (pathname !== "/") {
      setHomeNavActive(false);
      return () => {
        window.removeEventListener("scroll", updateNavState);
        window.removeEventListener("resize", updateNavState);
      };
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
      window.removeEventListener("scroll", updateNavState);
      window.removeEventListener("resize", updateNavState);
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

  const closeMenus = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <header className={`site-header marketing-header${menuOpen ? " is-mobile-open" : ""}${navCollapsed ? " is-scrolled" : ""}`}>
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
          </div>
          <div className="nav-right">
            {navItems.map((item) => {
              const baseHref = item.href.split("#")[0];
              const isActive = item.href === "/" ? pathname === "/" && !homeNavActive : pathname === baseHref && item.href.indexOf("#") === -1;

              return (
                <Link
                  key={item.key}
                  className={`nav-link${isActive ? " is-active" : ""}`}
                  href={item.href}
                  title={item.label}
                  onClick={closeMenus}
                >
                  <NavIcon name={item.icon} size={17} />
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
            <Link className={`button button-primary nav-action${pathname === "/login" ? " is-active" : ""}`} href="/login" title="Try now / Download" onClick={closeMenus}>
              <NavIcon name="arrow" size={17} />
              <span className="nav-label">Try now / Download</span>
            </Link>
          </div>
        </nav>
      </header>
      {children}
      {pathname !== "/login" && pathname !== "/register" && pathname !== "/forgot-password" && (
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
                <li><Link href="/features#use-cases">Use cases</Link></li>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/login">Try now / Download</Link></li>
              </ul>
            </div>
            <div>
              <p className="footer-heading">Workspace</p>
              <ul className="footer-links">
                <li><Link href="/login">Sign in</Link></li>
                <li><Link href="/register">Create account</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Klario. For organization and education - not a substitute for professional medical advice.</p>
          </div>
        </footer>
      )}
    </>
  );
}
