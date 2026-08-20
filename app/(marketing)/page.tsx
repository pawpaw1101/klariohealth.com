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
    title: "Body System Dashboard & Status Overview",
    body: "View live metric status organized by anatomical system. Review items, recent documents, and family records are structured around the next health action.",
    points: [
      {
        title: "Anatomical Body Mapping",
        desc: "Live biomarker status mapped across metabolic, cardiovascular, kidney, liver, thyroid, and blood systems."
      },
      {
        title: "Unified Action Queue",
        desc: "High-priority review items, pending uploads, and out-of-range flags surfaced immediately for review."
      },
      {
        title: "Longitudinal Readiness Score",
        desc: "Holistic score and status indicators tracking record completeness and recency across all family members."
      },
      {
        title: "Instant Diagnostic Search",
        desc: "Search biomarkers, labs, reference ranges, and test dates across all formats with immediate source context."
      }
    ],
    image: "/investor-screens/03_dashboard_body_populated.png",
    alt: "Klario health dashboard"
  },
  {
    label: "Trends",
    title: "Multi-Point Health Metric Tracking",
    body: "Aggregates identical metrics across multiple testing dates into continuous trend charts, making changes easy to spot across months and years.",
    points: [
      {
        title: "Multi-Point Aggregation",
        desc: "Combines repeated lab measurements from different testing dates into a single longitudinal timeline."
      },
      {
        title: "Statistical Deltas & Ranges",
        desc: "Displays latest values, rolling averages, absolute delta, and lab-provided normal reference bounds."
      },
      {
        title: "Strict Unit Safety Rules",
        desc: "Built-in validation prevents improper merging of incompatible measurements and different unit scales."
      },
      {
        title: "Custom Time Ranges",
        desc: "Analyze progression across custom timeframes: Week, Month, 6 Months, 1 Year, and All history."
      }
    ],
    image: "/investor-screens/14_trends_overview_populated.png",
    alt: "Klario longitudinal health trends"
  },
  {
    label: "Reports",
    title: "Deterministic Report-to-Metric Processing",
    body: "Capture diagnostic documents via camera scan, photo library, or PDF files. The deterministic pipeline parses tests with zero conversational AI guessing.",
    points: [
      {
        title: "Multi-Source Capture",
        desc: "Ingest diagnostic files via mobile camera scan, photo library, direct PDF upload, or email forwarding."
      },
      {
        title: "Deterministic Parser",
        desc: "Standardizes aliases, units, and ranges using structured clinical schemas without AI hallucinations."
      },
      {
        title: "Organized Document Index",
        desc: "Saved reports remain searchable by family member, report type, testing facility, and date."
      },
      {
        title: "Multi-Provider Consolidation",
        desc: "Independent health record layer not tied to a single hospital or siloed patient portal."
      }
    ],
    image: "/investor-screens/07_reports_populated.png",
    alt: "Klario medical reports"
  },
  {
    label: "Family",
    title: "Household Profiles with Enforced Access Boundaries",
    body: "Individualized profiles for dependents, parents, partners, and pets inside one household workspace, with server-enforced role permissions.",
    points: [
      {
        title: "Individualized Profiles",
        desc: "Manage distinct health histories for children, spouse, aging parents, and dependents under one account."
      },
      {
        title: "Role-Based Access Controls",
        desc: "Configurable permissions for Owners, Admins, Contributors, and Viewers with re-verification on every interaction."
      },
      {
        title: "Isolated Metric Baselines",
        desc: "Assign each report to the right person before values enter longitudinal graphs and trend tracking."
      },
      {
        title: "Non-Destructive Archiving",
        desc: "Preserve complete longitudinal diagnostic histories safely without destructive data loss."
      }
    ],
    image: "/investor-screens/22_family_overview_populated.png",
    alt: "Klario family health profiles"
  },
  {
    label: "Document",
    title: "Verifiable Source Lineage & Provenance",
    body: "The original source report remains permanently connected to extracted results, ensuring numbers never float away from their evidentiary origin.",
    points: [
      {
        title: "Direct Source Navigation",
        desc: "Click any plotted metric or data point to instantly inspect the exact highlighted page on the source lab PDF."
      },
      {
        title: "Immutable Lineage Separation",
        desc: "Clean separation between raw parser output, manual user adjustments, and immutable source files."
      },
      {
        title: "Expiring Signed URLs",
        desc: "Automated malware scanning and signed, expiring access tokens for all document views."
      },
      {
        title: "Protected Local Storage",
        desc: "Device-bound Keychain token management and encrypted caches prevent unauthorized credential migration."
      }
    ],
    image: "/investor-screens/11_report_provenance.png",
    alt: "Klario report source evidence"
  },
  {
    label: "Review",
    title: "Structured Gating & Metric Verification",
    body: "Metric review sheets keep extracted values, units, flags, and lab-provided reference ranges together for verification before entering permanent records.",
    points: [
      {
        title: "Automated Out-of-Range Flags",
        desc: "Immediate visual flags for high and low biomarker values compared against test-specific reference bounds."
      },
      {
        title: "Gating & Anomaly Protection",
        desc: "Incompatible units and non-numeric values route to dedicated review queues rather than misleading charts."
      },
      {
        title: "Parser Confidence Transparency",
        desc: "Full visibility into extraction confidence and field-level metadata for clinical peace of mind."
      },
      {
        title: "Audit Trail & Verification",
        desc: "Every value retains its original report, laboratory provenance, and complete audit history."
      }
    ],
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
        <section className="premium-section premium-section-workflow">
          <div className="premium-section-copy reveal">
            <h2>Move from report to trend without losing context.</h2>
            <p>Upload PDFs, photos, pasted text, or email imports. Klario extracts the dates, values, units, and source details so the record is ready to review.</p>
          </div>
          <div className="workflow-steps reveal">
            {[
              {
                title: "Add reports",
                desc: "Bring scattered files into one place."
              },
              {
                title: "Extract values",
                desc: "Structure biomarkers and reference ranges."
              },
              {
                title: "Track changes",
                desc: "See timelines and biomarker movement."
              }
            ].map((step, index) => (
              <div className="workflow-step" key={step.title}>
                <span className="step-number" aria-hidden="true">{index + 1}</span>
                <div className="step-content">
                  <strong>{step.title}</strong>
                  <small>{step.desc}</small>
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
