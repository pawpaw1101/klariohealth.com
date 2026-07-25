import Link from "next/link";
import Image from "next/image";
import type { MouseEventHandler } from "react";

type BrandProps = {
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function Brand({ href = "/", onClick }: BrandProps) {
  return (
    <Link className="logo" href={href} onClick={onClick} aria-label="Klario home">
      <span className="logo-mark" aria-hidden="true">
        <Image
          src="/klario-logo.jpg"
          alt=""
          width={44}
          height={44}
          priority
          className="logo-image"
        />
      </span>
      <span className="logo-text">Klario</span>
    </Link>
  );
}
