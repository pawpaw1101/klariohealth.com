import type { Metadata } from "next";
import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";
import { SectionHeader } from "@/components/section";
import { productUseCases } from "@/lib/klario-data";

export const metadata: Metadata = {
  title: "Use Cases",
  description: "Practical ways Klario helps people organize reports, track biomarkers, and manage family health records."
};

export default function UseCasesPage() {
  return (
    <main className="content premium-page">
      <section className="hero">
        <div className="hero-copy">

          <h1>Useful when health records start piling up.</h1>
          <p className="hero-lead">
            Klario is built for everyday health tracking: understanding report changes, caring for family members, and finding the right context before the next appointment.
          </p>
          <div className="button-row">
            <Link className="button button-primary" href="/login">
              Try now / Download
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
          {productUseCases.map((item) => (
            <article className="card" key={item.title}>
              <span className="feature-icon" aria-hidden="true"><BioIcon name={item.icon} size={24} /></span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
