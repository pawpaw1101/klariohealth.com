import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";
import type { KlarioIconName } from "@/lib/icons";
import { type BioStatusTone, toneClass } from "@/lib/tone";

type DivProps = ComponentPropsWithoutRef<"div">;

export function Card({ className, ...props }: DivProps) {
  return <div className={`klario-card${className ? ` ${className}` : ""}`} {...props} />;
}

export function IconBadge({
  icon,
  tone = "blue",
  size = 40,
  className
}: {
  icon: KlarioIconName;
  tone?: BioStatusTone;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`klario-icon-badge ${toneClass(tone)}${className ? ` ${className}` : ""}`}
      style={{ "--badge-size": `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      <BioIcon name={icon} size={Math.min(size * 0.54, 24)} />
    </span>
  );
}

export function StatusPill({
  children,
  tone = "gray",
  fill = "surface",
  className
}: {
  children: ReactNode;
  tone?: BioStatusTone;
  fill?: "surface" | "tinted";
  className?: string;
}) {
  return <span className={`klario-status-pill ${toneClass(tone)} is-${fill}${className ? ` ${className}` : ""}`}>{children}</span>;
}

export function FilterChip({
  children,
  icon,
  active = false,
  tone = "brand",
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  icon?: KlarioIconName;
  active?: boolean;
  tone?: BioStatusTone;
}) {
  return (
    <button
      className={`klario-filter-chip ${toneClass(tone)}${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      type="button"
      aria-pressed={active}
      {...props}
    >
      {icon ? <BioIcon name={icon} size={15} /> : null}
      <span>{children}</span>
    </button>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search",
  label = "Search",
  className
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <label className={`klario-search-field${className ? ` ${className}` : ""}`}>
      <span className="sr-only">{label}</span>
      <span className="klario-search-field-icon" aria-hidden="true" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="search" />
      {value ? (
        <button type="button" onClick={() => onChange("")} aria-label="Clear search">
          x
        </button>
      ) : null}
    </label>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="klario-section-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="klario-section-header-action">{action}</div> : null}
    </div>
  );
}

export function RootPageHeader({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="klario-root-page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="klario-root-page-header-action">{action}</div> : null}
    </header>
  );
}

export function MetricCard({
  icon,
  tone = "blue",
  value,
  title,
  caption
}: {
  icon: KlarioIconName;
  tone?: BioStatusTone;
  value: string;
  title: string;
  caption: string;
}) {
  return (
    <Card className="klario-metric-card">
      <IconBadge icon={icon} tone={tone} size={36} />
      <strong>{value}</strong>
      <h3>{title}</h3>
      <p>{caption}</p>
    </Card>
  );
}

export function EmptyState({
  icon = "icon_action_confirm_safe",
  title,
  message,
  body,
  actionLabel,
  actionHref,
  variant = "card"
}: {
  icon?: KlarioIconName;
  title: string;
  message?: string;
  body?: string;
  actionLabel?: string;
  actionHref?: string;
  variant?: "card" | "inline";
}) {
  const description = body ?? message;
  const content = (
    <>
      <BioIcon name={icon} size={34} />
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {actionLabel && actionHref ? (
        <div className="button-row compact">
          <Link className="button button-primary" href={actionHref}>{actionLabel}</Link>
        </div>
      ) : null}
    </>
  );

  if (variant === "inline") {
    return <article className="record empty-state klario-empty-state is-inline">{content}</article>;
  }

  return (
    <Card className="klario-empty-state">
      {content}
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span className={`klario-skeleton${className ? ` ${className}` : ""}`} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <Card className="klario-skeleton-card" aria-busy="true" aria-label="Loading">
      <Skeleton className="is-badge" />
      <Skeleton className="is-title" />
      <Skeleton className="is-line" />
      <Skeleton className="is-line is-short" />
    </Card>
  );
}
