import type { Metadata } from "next";
import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";
import { SectionHeader } from "@/components/section";

export const metadata: Metadata = {
  title: "Security",
  description: "How Klario frames privacy, review, and responsible use for personal medical report organization."
};

const principles = [
  {
    title: "User review before saving",
    body: "Extracted values can be checked before they become part of the long-term record.",
    icon: "icon_action_confirm_safe"
  },
  {
    title: "Clear report ownership",
    body: "Reports are assigned to the right family member or pet so records stay separated.",
    icon: "icon_family_header"
  },
  {
    title: "Organizational support",
    body: "Klario helps organize and explain records. It does not replace professional medical advice.",
    icon: "icon_signal_confidence"
  },
  {
    title: "Transparent status",
    body: "Review queues and flags make uncertain or out-of-range entries easier to spot.",
    icon: "icon_signal_warning"
  }
];

export default function SecurityPage() {
  return (
    <main className="content premium-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" /> Security</p>
          <h1>Health records deserve careful handling.</h1>
          <p className="hero-lead">
            Klario is designed around clear ownership, visible review states, and responsible use so medical reports become easier to manage without pretending to be a doctor.
          </p>
          <div className="button-row">
            <Link className="button button-primary" href="/login">
              Try for free
              <BioIcon name="icon_action_continue" size={18} />
            </Link>
            <Link className="button button-secondary" href="/about">About Klario</Link>
          </div>
        </div>
        <div className="security-panel" aria-label="Klario security principles">
          <div>
            <strong>Review</strong>
            <span>Confirm values before they shape trends.</span>
          </div>
          <div>
            <strong>Separate</strong>
            <span>Keep family profiles and records distinct.</span>
          </div>
          <div>
            <strong>Clarify</strong>
            <span>Educational context, not medical diagnosis.</span>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionHeader
          label="Principles"
          title="Responsible by design"
          intro="The product flow keeps attention on confirmation, ownership, and clarity."
        />
        <div className="grid two-column-grid">
          {principles.map((item) => (
            <article className="card" key={item.title}>
              <span className="feature-icon" aria-hidden="true"><BioIcon name={item.icon} size={24} /></span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <h2>Know what Klario is for.</h2>
        <p>Klario is for organizing, tracking, and understanding records. Clinical decisions should stay with qualified professionals.</p>
        <div className="button-row">
          <Link className="button button-primary" href="/features">Explore product</Link>
          <Link className="button button-secondary" href="/login">Try for free</Link>
        </div>
      </section>
    </main>
  );
}
