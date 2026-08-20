import Link from "next/link";
import type { MouseEventHandler, SVGProps } from "react";

type BrandProps = {
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

type FallbackBrandIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function FallbackBrandIcon({ size = 24, className, ...props }: FallbackBrandIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={`fallback-brand-icon${className ? ` ${className}` : ""}`}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <rect x="5" y="4" width="14" height="16" rx="3" />
      <path d="M9 8h6" />
      <path d="M9 16h2.2l1.4-3.8 1.4 2.6H16" />
    </svg>
  );
}

export function Brand({ href = "/", onClick }: BrandProps) {
  return (
    <Link className="logo" href={href} onClick={onClick} aria-label="Klario home">
      <img
        alt="Klario"
        className="logo-image"
        draggable={false}
        height={67}
        src="/brand/klario-logo-light.png"
        srcSet="/brand/klario-logo-light.png 1x, /brand/klario-logo-light@2x.png 2x, /brand/klario-logo-light@3x.png 3x"
        width={137}
      />
    </Link>
  );
}
