import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import trendsImage from "@/assets/screenshots/klario-trends.jpeg";
import { BioIcon } from "@/components/bio-icon";
import { SectionHeader } from "@/components/section";

export const metadata: Metadata = {
  title: "About",
  description: "Klario was born from a real need: finding when a parent's blood sugar started spiking across hundreds of lab reports."
};

const problemCards = [
  {
    title: "Reports are scattered",
    body: "Lab results often live across email, paper folders, PDFs, hospital portals, and phone galleries.",
    icon: "icon_tab_documents"
  },
  {
    title: "Trends are hard to spot",
    body: "A single result is easy to read. A pattern across years of tests is much harder to compare manually.",
    icon: "icon_tab_trends"
  },
  {
    title: "Families need context",
    body: "People often manage records for parents, children, partners, and pets, but those records rarely live together.",
    icon: "icon_tab_family"
  },
  {
    title: "Medical language is dense",
    body: "Reports can explain what a value is, but not always what it means in plain language for everyday tracking.",
    icon: "icon_signal_insights"
  }
];

export default function AboutPage() {
  return (
    <main className="content cascade-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" /> About Klario</p>
          <h1>Health records should not feel impossible to follow.</h1>
          <p className="hero-lead">
            Klario helps people organize medical reports, track biomarker changes, and understand what their records are saying over time.
            Without having to compare every line by hand.
          </p>
        </div>
        <figure className="hero-image">
          <Image src={trendsImage} alt="Klario workspace showing biomarker trends" priority sizes="(max-width: 900px) 100vw, 540px" />
        </figure>
      </section>

      <section className="section">
        <div className="story-block">
          <h2>Who we are</h2>
          <div className="story-block-content">
            <p>Klario is being built for people who want a clearer view of their health records without manually comparing every report line by line.</p>
            <p>The product brings report storage, parsing, timelines, family profiles, and understandable insights into one app, designed for everyday tracking, not clinical complexity.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="story-block">
          <h2>How we started</h2>
          <div className="story-block-content">
            <p>The idea came from a cofounder trying to find the exact moment an aging parent's blood sugar started spiking.</p>
            <p>That meant sorting through hundreds of blood tests and trying to remember small details that could have major consequences. Klario was created so that kind of answer can be found with a chart, a timeline, and the right context.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionHeader
          label="The challenge"
          title="The problem"
          intro="Most people can read a single lab report. What breaks down is keeping years of results organized, comparable, and understandable, especially across a family."
        />
        <div className="grid two-column-grid">
          {problemCards.map((card) => (
            <article className="card" key={card.title}>
              <span className="feature-icon" aria-hidden="true"><BioIcon name={card.icon} size={24} /></span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="story-block">
          <h2>Our solution</h2>
          <div className="story-block-content">
            <p>Klario lets users upload medical reports, extracts the key values, plots them over time, and gives understandable explanations so users can see what changed and when.</p>
            <p>It is built for personal tracking and family organization. Klario is educational and organizational support, not a replacement for professional medical advice.</p>
            <div className="button-row">
              <Link className="button button-primary" href="/features">Explore features</Link>
              <Link className="button button-secondary" href="/login">Try for free</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-banner">
        <h2>Built for the moment you need an answer.</h2>
        <p>When did that value start changing? Klario is designed to answer questions like that in seconds, not hours.</p>
        <div className="button-row">
          <Link className="button button-primary" href="/login">Try for free</Link>
        </div>
      </section>
    </main>
  );
}
