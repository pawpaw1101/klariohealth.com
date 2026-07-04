import type { Metadata } from "next";
import Link from "next/link";
import dashboardLight from "@/assets/screenshots/klario-dashboard-light.jpeg";
import trendsImage from "@/assets/screenshots/klario-trends.jpeg";
import timelineImage from "@/assets/screenshots/klario-timeline.jpeg";
import familyImage from "@/assets/screenshots/klario-family.jpeg";
import { BioIcon } from "@/components/bio-icon";
import { FluidHeroCanvas } from "@/components/fluid-hero-canvas";
import { HomeShowcase } from "@/components/home-showcase";
import { featureSnapshots } from "@/lib/klario-data";

export const metadata: Metadata = {
  title: "Medical Clarity",
  description: "Upload lab results once. Klario parses them, plots biomarkers over time, and explains what changed."
};

const featureIcons = [
  "icon_doc_add_empty",
  "icon_tab_trends",
  "icon_signal_warning",
  "icon_signal_insights",
  "icon_tab_family",
  "icon_timeline_empty"
];

const showcaseItems = [
  {
    label: "Dashboard",
    title: "Know what needs attention.",
    body: "Review items, recent documents, and family records are organized around the next health task.",
    image: dashboardLight,
    alt: "Klario dashboard showing documents, family, review items, and extracted values"
  },
  {
    label: "Trends",
    title: "See movement across every test.",
    body: "Repeated values become trend lines, so changes are easier to spot across months and years.",
    image: trendsImage,
    alt: "Klario workspace showing biomarker trends"
  },
  {
    label: "Timeline",
    title: "Keep the health history in order.",
    body: "Reports, medications, vaccines, and appointments stay connected by date and family member.",
    image: timelineImage,
    alt: "Klario timeline showing chronological health events"
  },
  {
    label: "Family",
    title: "Manage family records separately.",
    body: "Assign each report to the right person or pet before values enter the shared account.",
    image: familyImage,
    alt: "Klario family workspace showing profiles"
  }
];

export default function HomePage() {
  return (
    <main className="liquid-page">
      <section className="liquid-hero" id="hero" aria-labelledby="home-hero-title">
        <FluidHeroCanvas />
        <div className="liquid-hero-sheen" aria-hidden="true" />
        <div className="liquid-hero-copy">
          <h1 id="home-hero-title">Klario</h1>
          <p className="hero-lead">
            Your reports, finally clear. Upload lab results once, see biomarkers move over time, and understand what changed without digging through PDFs.
          </p>
        </div>
        <Link className="scroll-cue" href="#premium-content" aria-label="Scroll to the next section" title="Scroll">
          <BioIcon name="icon_action_continue" size={24} />
        </Link>
      </section>

      <div className="premium-stack" id="premium-content">
        <section className="premium-section premium-section-dark">
          <div className="premium-section-copy reveal">
            <p className="section-label">Organize</p>
            <h2>Build one health record from every report.</h2>
            <p>Upload PDFs, photos, pasted text, or email imports. Klario extracts the dates, values, units, and source details so the record is ready to review.</p>
          </div>
          <div className="premium-steps reveal">
            {["Add reports", "Extract values", "Confirm results", "Track changes"].map((step, index) => (
              <div className="premium-step magnetic" key={step}>
                <span className="step-number">{index + 1}</span>
                <div className="step-content">
                  <strong>{step}</strong>
                  <small>{["Bring scattered files into one place.", "Structure biomarkers and reference ranges.", "Review uncertain or out-of-range entries.", "See timelines and biomarker movement."][index]}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="premium-section premium-section-light">
          <div className="premium-section-copy reveal">
            <p className="section-label">Understand</p>
            <h2>Stay on top of what changed.</h2>
            <p>Klario keeps the clinical details readable: flagged values, family member context, dates, units, and plain-language explanations stay together.</p>
          </div>
          <div className="premium-feature-list">
            {featureSnapshots.map((feature, index) => {
              return (
                <article className="premium-feature reveal tilt-card" key={feature.title}>
                  <span className="feature-icon" aria-hidden="true">
                    <BioIcon name={featureIcons[index]} size={22} />
                  </span>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="premium-section premium-section-showcase">
          <div className="premium-section-copy reveal">
            <p className="section-label">Review</p>
            <h2>Move from report to trend without losing context.</h2>
            <p>Dashboard, documents, timelines, family profiles, and biomarker charts stay connected around the same underlying health record.</p>
          </div>
          <div className="reveal">
            <HomeShowcase items={showcaseItems} />
          </div>
        </section>

        <section className="premium-section premium-section-cta">
          <div className="premium-section-copy reveal">
            <p className="section-label">Start</p>
            <h2>Start with your next report.</h2>
            <p>Add one lab report and Klario begins building the timeline, trend history, and review queue around it.</p>
            <div className="button-row">
              <Link className="button button-primary magnetic" href="/login">
                Try for free
                <BioIcon name="icon_action_continue" size={18} />
              </Link>
              <Link className="button button-secondary glass-button" href="/features#how-it-works">
                How it works
                <BioIcon name="icon_signal_insights" size={18} />
              </Link>
            </div>
            <p className="note cta-note">
              New here? <Link href="/register">Create an account</Link> with your email and password.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
