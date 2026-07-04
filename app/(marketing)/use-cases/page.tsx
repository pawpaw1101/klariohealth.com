import type { Metadata } from "next";
import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";
import { SectionHeader } from "@/components/section";

export const metadata: Metadata = {
  title: "Use Cases",
  description: "Practical ways Klario helps people organize reports, track biomarkers, and manage family health records."
};

const useCases = [
  {
    title: "Track long-term biomarkers",
    body: "Follow HbA1c, ferritin, vitamin D, thyroid, cholesterol, CBC, and other repeated values across reports.",
    icon: "icon_tab_trends"
  },
  {
    title: "Prepare for doctor visits",
    body: "Bring a cleaner view of recent reports, flagged values, and timeline context into appointments.",
    icon: "icon_med_visit"
  },
  {
    title: "Care for parents",
    body: "Keep older family members' reports organized and compare changes without hunting through old files.",
    icon: "icon_tab_family"
  },
  {
    title: "Manage child records",
    body: "Store visits, prescriptions, vaccines, growth metrics, and lab reports in one chronological record.",
    icon: "icon_med_vaccine"
  },
  {
    title: "Review new reports faster",
    body: "See what needs attention, what changed, and which values should be confirmed before saving.",
    icon: "icon_signal_warning"
  },
  {
    title: "Build a family timeline",
    body: "Connect reports, appointments, medications, and notes by date while keeping profiles separate.",
    icon: "icon_timeline_empty"
  }
];

export default function UseCasesPage() {
  return (
    <main className="content premium-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" /> Use cases</p>
          <h1>Useful when health records start piling up.</h1>
          <p className="hero-lead">
            Klario is built for everyday health tracking: understanding report changes, caring for family members, and finding the right context before the next appointment.
          </p>
          <div className="button-row">
            <Link className="button button-primary" href="/login">
              Try for free
              <BioIcon name="icon_action_continue" size={18} />
            </Link>
            <Link className="button button-secondary" href="/features#how-it-works">See how it works</Link>
          </div>
        </div>
        <div className="hero-usecase-panel" aria-label="Klario workflow examples">
          <span>Upload a report</span>
          <span>Compare with history</span>
          <span>Review what changed</span>
          <span>Share cleaner context</span>
        </div>
      </section>

      <section className="section">
        <SectionHeader
          label="Scenarios"
          title="Where Klario helps"
          intro="Each workflow starts with a report and ends with a clearer timeline, trend, or review queue."
        />
        <div className="grid feature-grid">
          {useCases.map((item) => (
            <article className="card" key={item.title}>
              <span className="feature-icon" aria-hidden="true"><BioIcon name={item.icon} size={24} /></span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <h2>Start with one real report.</h2>
        <p>Klario gets more useful as your timeline and trend history grow.</p>
        <div className="button-row">
          <Link className="button button-primary" href="/login">Try for free</Link>
          <Link className="button button-secondary" href="/features">Explore product</Link>
        </div>
      </section>
    </main>
  );
}
