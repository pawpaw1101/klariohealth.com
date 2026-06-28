import type { CSSProperties } from "react";

type BioIconProps = {
  name: string;
  size?: number;
  label?: string;
  className?: string;
};

type IconStyle = CSSProperties & {
  "--icon-url": string;
  "--icon-size": string;
};

export function BioIcon({ name, size = 20, label, className }: BioIconProps) {
  return (
    <span
      aria-hidden={label ? undefined : "true"}
      aria-label={label}
      className={`bio-icon${className ? ` ${className}` : ""}`}
      role={label ? "img" : undefined}
      style={{
        "--icon-url": `url("/icons/${name}.svg")`,
        "--icon-size": `${size}px`
      } as IconStyle}
    />
  );
}
