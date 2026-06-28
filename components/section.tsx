type SectionHeaderProps = {
  label?: string;
  title: string;
  intro?: string;
};

export function SectionHeader({ label, title, intro }: SectionHeaderProps) {
  return (
    <div className="section-header">
      {label ? <p className="section-label">{label}</p> : null}
      <h2>{title}</h2>
      {intro ? <p className="section-intro">{intro}</p> : null}
    </div>
  );
}

export function PageTitle({ title, body }: { title: string; body: string }) {
  return (
    <div className="app-page-title">
      <h1>{title}</h1>
      <p>{body}</p>
    </div>
  );
}
