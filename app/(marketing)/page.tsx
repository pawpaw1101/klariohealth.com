import type { Metadata } from "next";
import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";
import { FluidHeroCanvas } from "@/components/fluid-hero-canvas";
import { HomeShowcase } from "@/components/home-showcase";
import { HeroGallery } from "@/components/hero-gallery";
import { featureSnapshots } from "@/lib/klario-data";

export const metadata: Metadata = {
  title: "Medical Clarity",
  description: "Upload lab results once. Klario parses them, plots biomarkers over time, and explains what changed."
};

const showcaseItems = [
  {
    label: "Dashboard",
    title: "Know what needs attention.",
    body: "Review items, recent documents, and family records are organized around the next health task.",
    image: "/investor-screens/03_dashboard_body_populated.png",
    alt: "Klario health dashboard"
  },
  {
    label: "Trends",
    title: "See movement across every test.",
    body: "Repeated values become trend lines, so changes are easier to spot across months and years.",
    image: "/investor-screens/14_trends_overview_populated.png",
    alt: "Klario longitudinal health trends"
  },
  {
    label: "Reports",
    title: "Keep every report easy to find.",
    body: "Saved reports stay searchable by person, type, date, and review status.",
    image: "/investor-screens/07_reports_populated.png",
    alt: "Klario medical reports"
  },
  {
    label: "Family",
    title: "Manage family records separately.",
    body: "Assign each report to the right person or pet before values enter the shared account.",
    image: "/investor-screens/22_family_overview_populated.png",
    alt: "Klario family health profiles"
  },
  {
    label: "Document",
    title: "Open the source when context matters.",
    body: "The original report stays connected to extracted results, so numbers never float away from their source.",
    image: "/investor-screens/11_report_provenance.png",
    alt: "Klario report source evidence"
  },
  {
    label: "Review",
    title: "Inspect each extracted value.",
    body: "Metric sheets keep values, units, flags, and reference ranges together before you act on them.",
    image: "/investor-screens/09_report_detail_structured.png",
    alt: "Klario structured laboratory report"
  }
];

export default function HomePage() {
  return (
    <main className="liquid-page">
      <section className="liquid-hero" id="hero" aria-labelledby="home-hero-title">
        <FluidHeroCanvas />
        <div className="liquid-hero-sheen" aria-hidden="true" />
        <div className="liquid-hero-copy home-hero-copy">
          <h1 className="hero-wordmark-title" id="home-hero-title">
            <img
              alt="Klario"
              draggable={false}
              height={874}
              src="/brand/klario-logo-hero-white.png"
              width={1799}
            />
          </h1>
          <p className="hero-lead">
            Private health records intelligently organised — so you can focus on feeling better, not filing paperwork.
          </p>
          <div className="button-row hero-cta-row">
            <Link className="button button-primary magnetic" href="/login">
              Try for free
              <BioIcon name="icon_action_continue" size={18} />
            </Link>
            <Link className="button glass-button" href="/features">
              See how it works
              <BioIcon name="icon_signal_summary" size={18} />
            </Link>
          </div>
        </div>
      </section>

      <HeroGallery />

      <div className="premium-stack" id="premium-content">
        <section className="premium-section premium-section-dark">
          <div className="premium-section-copy reveal">

            <h2>Move from report to trend without losing context.</h2>
            <p>Upload PDFs, photos, pasted text, or email imports. Klario extracts the dates, values, units, and source details so the record is ready to review.</p>
          </div>
          <div className="premium-steps reveal">
            {["Add reports", "Extract values", "Track changes"].map((step, index) => (
              <div className="premium-step magnetic" key={step}>
                <span className="step-number">{index + 1}</span>
                <div className="step-content">
                  <strong>{step}</strong>
                  <small>{["Bring scattered files into one place.", "Structure biomarkers and reference ranges.", "See timelines and biomarker movement."][index]}</small>
                </div>
              </div>
            ))}
          </div>
        </section>


        <section className="premium-section premium-section-showcase" style={{ gridTemplateColumns: "1fr" }}>
          <div className="reveal">
            <HomeShowcase items={showcaseItems} />
          </div>
        </section>

        <section className="premium-section premium-section-cta">
          <div className="premium-section-copy reveal">
            <div className="cta-logo-badge" aria-hidden="true">
              <img
                alt=""
                draggable={false}
                height={67}
                src="/brand/klario-logo-dark.png"
                srcSet="/brand/klario-logo-dark.png 1x, /brand/klario-logo-dark@2x.png 2x, /brand/klario-logo-dark@3x.png 3x"
                width={137}
              />
            </div>
            <h2>Start with your next report.</h2>
            <p>Add one lab report and Klario begins building the timeline, trend history, and review queue around it.</p>
            <div className="button-row">
              <Link className="button button-primary magnetic" href="/login">
                Try for free
                <BioIcon name="icon_action_continue" size={18} />
              </Link>
              <Link className="button button-secondary glass-button" href="/features#how-it-works">
                How it works
                <BioIcon name="icon_signal_summary" size={18} />
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
