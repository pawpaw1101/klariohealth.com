import Link from "next/link";
import type { MouseEventHandler } from "react";
import { NavIcon } from "@/components/nav-icon";

type BrandProps = {
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function Brand({ href = "/", onClick }: BrandProps) {
  return (
    <Link className="logo" href={href} onClick={onClick} aria-label="Klario home">
      <span className="logo-mark" aria-hidden="true">
        <NavIcon name="logo" size={20} />
      </span>
      <span className="logo-text">Klario</span>
    </Link>
  );
}
