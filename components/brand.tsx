import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";

type BrandProps = {
  href?: string;
};

export function Brand({ href = "/" }: BrandProps) {
  return (
    <Link className="logo" href={href} aria-label="Klario home">
      <span className="logo-mark" aria-hidden="true">
        <BioIcon name="icon_signal_insights" size={20} />
      </span>
      <span className="logo-text">Klario</span>
    </Link>
  );
}
