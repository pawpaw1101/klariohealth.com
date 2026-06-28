import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import uploadImage from "@/assets/screenshots/klario-add-document.jpeg";
import { BioIcon } from "@/components/bio-icon";
import { SectionHeader } from "@/components/section";

export const metadata: Metadata = {
  title: "Features",
  description: "AI-powered parsing, biomarker charts, actionable insights, and family tracking from one medical report app."
};

const features = [
  {
    title: "AI powered",
    body: "Klario uses AI to extract meaningful health data from uploaded medical reports and turn it into structured records.",
    icon: "icon_signal_insights"
  },
  {
    title: "Tuned engine",
    body: "The parsing flow is tuned for medical reports, biomarker names, units, ranges, and repeated tests.",
    icon: "icon_filter_metric"
  },
  {
    title: "Accurate file parsing",
    body: "Reports can be added from images, PDFs, files, pasted text, or email, then reviewed before values are saved.",
    icon: "icon_med_lab_report"
  },
  {
    title: "Actionable insights",
    body: "See which values need attention, what changed, and where to look next in your record history.",
    icon: "icon_action_confirm_safe"
  },
  {
    title: "Family tracking",
    body: "One app can hold records for multiple family members, including pets with species selection before upload.",
    icon: "icon_tab_family"
  },
  {
    title: "Record explanations",
    body: "Klario explains what a record means in plain language and what the tracked value is doing in the body.",
    icon: "icon_signal_confidence"
  }
];

const steps = [
  ["Upload", "Add a report by taking a photo, choosing an image, uploading a PDF, pasting text, or importing from email."],
  ["Parse", "Klario extracts biomarker names, values, dates, units, reference ranges, and report source details."],
  ["Review", "Confirm values, review flags, and keep ambiguous results from entering the record too quickly."],
  ["Track", "Charts and timelines show how biomarkers move across tests, visits, medications, vaccines, and family profiles."]
];

export default function FeaturesPage() {
  return (
    <main className="content cascade-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" /> Features</p>
          <h1>From uploaded report to useful health timeline.</h1>
          <p className="hero-lead">
            Klario is designed around the full flow: capture a report, parse it accurately, review important values, chart changes, and explain what the record means.
          </p>
          <div className="button-row">
            <Link className="button button-primary" href="/login">
              Try for free
              <BioIcon name="icon_action_continue" size={18} />
            </Link>
          </div>
        </div>
        <figure className="hero-image">
          <Image src={uploadImage} alt="Klario upload screen showing report import methods" priority sizes="(max-width: 900px) 100vw, 540px" />
        </figure>
      </section>

      <section className="section">
        <SectionHeader
          label="Capabilities"
          title="Core features"
          intro="Everything you need to go from a stack of lab PDFs to a living picture of your health and your family's."
        />
        <div className="grid feature-grid">
          {features.map((feature) => (
            <article className="card" key={feature.title}>
              <span className="feature-icon" aria-hidden="true"><BioIcon name={feature.icon} size={24} /></span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeader
          label="Workflow"
          title="How it works"
          intro="Four steps from scattered paperwork to a health timeline you can actually use."
        />
        <div className="grid two-column-grid">
          {steps.map(([title, body], index) => (
            <article className="card" key={title}>
              <span className="card-number" aria-hidden="true">{index + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <h2>Ready to see your data differently?</h2>
        <p>Upload your first report and watch Klario build your health timeline.</p>
        <div className="button-row">
          <Link className="button button-primary" href="/login">Try for free</Link>
          <Link className="button button-secondary" href="/about">Learn our story</Link>
        </div>
      </section>
    </main>
  );
}
