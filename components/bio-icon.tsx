import type { CSSProperties } from "react";
import type { KlarioIconName } from "@/lib/icons";

type BioIconProps = {
  name: KlarioIconName;
  size?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
};

type IconStyle = CSSProperties & {
  "--icon-url": string;
  "--icon-size": string;
};

export function BioIcon({ name, size = 20, label, className, style }: BioIconProps) {
  return (
    <span
      aria-hidden={label ? undefined : "true"}
      aria-label={label}
      className={`bio-icon${className ? ` ${className}` : ""}`}
      role={label ? "img" : undefined}
      style={{
        ...style,
        "--icon-url": `url("/icons/${name}.svg")`,
        "--icon-size": `${size}px`
      } as IconStyle}
    />
  );
}
