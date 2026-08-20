import type { Metadata } from "next";
import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";

export const metadata: Metadata = {
  title: "About Klario | Story, Vision & Health Records",
  description: "What if your medical history could tell its own story? Klario turns scattered medical reports into structured, verifiable health history over time."
};

const frustratingQuestions = [
  "“When did this value start changing?”",
  "“What was the result six months ago?”",
  "“Which report did this number come from?”",
  "“Is this my report or my parent's?”",
  "“Do I really need to open every PDF again?”"
];

const userFrustrations = [
  "“I have all my reports somewhere, but I can never find the one I need.”",
  "“Every time I visit the doctor, I end up scrolling through old reports trying to compare numbers.”",
  "“Keeping track of my parent's reports is exhausting. I just want to know what changed.”",
  "“I know the information is there. I just don't have the time to go through it every time.”"
];

const roadmapPhases = [
  {
    phase: "Available Today",
    badge: "Current",
    desc: "A foundation for organizing medical records, extracting structured health metrics, viewing longitudinal trends, and managing family profiles.",
    items: [
      "Native iOS app",
      "OCR pipeline",
      "Deterministic parser",
      "Longitudinal charts",
      "Family roles"
    ]
  },
  {
    phase: "Next",
    badge: "In Progress",
    desc: "We're expanding the product with new capabilities and record management.",
    items: [
      "Push notification delivery",
      "Report archiving UI",
      "Export generation",
      "Subscription entitlements"
    ]
  },
  {
    phase: "Future",
    badge: "Upcoming",
    desc: "Long-term vision for multi-provider connectivity and team access.",
    items: [
      "Direct health-record platform connections",
      "Connected app APIs",
      "Provider team access"
    ]
  }
];



const questionBehindReport = [
  "“What has changed?”",
  "“When did it change?”",
  "“What was it before?”",
  "“Which report did that number come from?”",
  "“Can I see the whole picture?”"
];

export default function AboutPage() {
  return (
    <main className="content premium-page" style={{ background: "linear-gradient(180deg, #f0fdfa 0%, #e6fffa 50%, #f0fdfa 100%)", minHeight: "100vh" }}>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-copy" style={{ maxWidth: "820px" }}>
          <h1 style={{ color: "#042f2e", fontSize: "clamp(2.4rem, 4.5vw, 3.8rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            Health records shouldn't be this hard to keep track of.
          </h1>
          <p className="hero-lead" style={{ fontSize: "1.2rem", color: "#134e4a", marginTop: "18px", lineHeight: 1.6 }}>
            Medical reports pile up over time. One PDF is in an email, another is in a hospital portal, another is sitting in a phone gallery — and when you actually need to understand what changed, you're left searching through everything again.
          </p>
          <div className="button-row" style={{ marginTop: "28px" }}>
            <Link className="button button-primary" href="/login">
              Try now / Download
              <BioIcon name="icon_action_continue" size={18} />
            </Link>
            <Link className="button button-secondary glass-button" href="/login" style={{ background: "rgba(13, 148, 136, 0.12)", color: "#0f766e", borderColor: "rgba(15, 118, 110, 0.3)" }}>
              Already have an account? Log in
            </Link>
          </div>
        </div>

        {/* Hero Showcase Widget */}
        <div
          className="hero-showcase-widget"
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            padding: "26px",
            border: "1px solid rgba(20, 184, 166, 0.28)",
            boxShadow: "0 20px 48px rgba(15, 23, 42, 0.08)",
            color: "#0f172a",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "rgba(20, 184, 166, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0f766e"
              }}
            >
              <BioIcon name="icon_tab_documents" size={20} style={{ color: "#0f766e", backgroundColor: "#0f766e" }} />
            </span>
            <div>
              <strong style={{ fontSize: "1.05rem", color: "#0f172a", display: "block" }}>Fragmented vs. Connected</strong>
              <span style={{ fontSize: "0.8rem", color: "#475569" }}>Why Klario matters</span>
            </div>
          </div>

          {/* Card 1: Scattered Files (Before) */}
          <div
            style={{
              background: "#fff5f5",
              borderRadius: "16px",
              padding: "16px 18px",
              border: "1px solid rgba(239, 68, 68, 0.22)",
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#b91c1c", textTransform: "uppercase", letterSpacing: "0.03em" }}>Scattered Reports</span>
              <span style={{ fontSize: "0.75rem", color: "#b91c1c", fontWeight: 700, background: "rgba(239, 68, 68, 0.1)", padding: "2px 8px", borderRadius: "6px" }}>Isolated Files</span>
            </div>
            <p style={{ fontSize: "0.92rem", color: "#7f1d1d", margin: 0, lineHeight: 1.4, fontWeight: 600 }}>
              PDFs in email threads, portal logins, and phone screenshots. Hard to compare trends or find history.
            </p>
          </div>

          {/* Card 2: Klario Timeline (After) */}
          <div
            style={{
              background: "linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)",
              borderRadius: "16px",
              padding: "16px 18px",
              border: "1px solid rgba(20, 184, 166, 0.28)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.03em" }}>With Klario</span>
              <span style={{ fontSize: "0.75rem", color: "#0f766e", fontWeight: 700, background: "rgba(20, 184, 166, 0.14)", padding: "2px 8px", borderRadius: "6px" }}>Structured Timeline</span>
            </div>
            <p style={{ fontSize: "0.92rem", color: "#0f172a", margin: 0, lineHeight: 1.4, fontWeight: 600 }}>
              Automatic document parsing, standardized reference ranges, and multi-year trend comparison in one place.
            </p>
          </div>
        </div>
      </section>

      <div className="premium-stack">


        {/* Section 2: The Problem (Mint Turquoise Tint Card) */}
        <section className="premium-section" style={{ background: "linear-gradient(145deg, #ccfbf1 0%, #e6fffa 100%)", border: "1px solid rgba(15, 118, 110, 0.25)", color: "#042f2e", gridTemplateColumns: "1fr" }}>
          <div className="showcase-copy" style={{ width: "100%" }}>
            <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#042f2e", marginBottom: "6px" }}>
              The problem isn't having the data. It's keeping track of it.
            </h2>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f766e", marginBottom: "14px" }}>
              Medical records accumulate quietly.
            </h3>
            <p style={{ fontSize: "1.05rem", color: "#134e4a", marginBottom: "20px" }}>
              A few blood tests become dozens. Dozens become years of reports. And eventually, simple questions become surprisingly difficult:
            </p>

            {/* Questions Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginBottom: "28px" }}>
              {frustratingQuestions.map((q: string) => (
                <div key={q} style={{ padding: "14px 18px", borderRadius: "14px", background: "#ffffff", border: "1px solid rgba(13, 148, 136, 0.25)", color: "#0f766e", fontWeight: 600, fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(4, 47, 46, 0.04)" }}>
                  {q}
                </div>
              ))}
            </div>

            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#042f2e", marginBottom: "14px" }}>
              Illustrative user frustrations
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {userFrustrations.map((uf) => (
                <div key={uf} style={{ padding: "18px 20px", borderRadius: "16px", background: "#ffffff", border: "1px solid rgba(20, 184, 166, 0.2)", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ background: "rgba(20, 184, 166, 0.15)", color: "#0f766e", padding: "6px", borderRadius: "50%", display: "inline-flex" }}>
                    <BioIcon name="icon_signal_summary" size={18} />
                  </span>
                  <span style={{ fontSize: "0.935rem", color: "#1e293b", lineHeight: 1.5, fontWeight: 500 }}>
                    {uf}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ marginTop: "20px", fontSize: "0.95rem", color: "#0f766e", fontStyle: "italic" }}>
              These are the kinds of everyday problems Klario is designed around.
            </p>
          </div>
        </section>



        {/* Section 4: Roadmap (Glassmorphic Turquoise Card) */}
        <section className="premium-section" style={{ background: "rgba(240, 253, 250, 0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(20, 184, 166, 0.3)", gridTemplateColumns: "1fr" }}>
          <div className="showcase-copy" style={{ width: "100%" }}>
            <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#042f2e", marginBottom: "8px" }}>
              Built today. Expanding tomorrow.
            </h2>
            <p className="showcase-lead" style={{ color: "#134e4a", marginBottom: "24px" }}>
              Where we're going next. Klario is being built in stages. We want the product to start as a reliable personal health-record layer and gradually become a more capable platform for individuals, families, and caregivers.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              {roadmapPhases.map((phase) => (
                <div key={phase.phase} style={{ padding: "24px", borderRadius: "20px", background: "#ffffff", border: "1px solid rgba(20, 184, 166, 0.25)", boxShadow: "0 8px 24px rgba(4, 47, 46, 0.05)", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: "1.2rem", color: "#042f2e", fontWeight: 800 }}>{phase.phase}</strong>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, padding: "4px 10px", borderRadius: "999px", background: "rgba(20, 184, 166, 0.15)", color: "#0f766e" }}>
                      {phase.badge}
                    </span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "18px", display: "grid", gap: "8px" }}>
                    {phase.items.map((item) => (
                      <li key={item} style={{ fontSize: "0.925rem", color: "#334155" }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>





        {/* Section 7: Compounding Timeline (Deep Slate Card) */}
        <section className="premium-section" style={{ background: "linear-gradient(135deg, #042f2e 0%, #134e4a 100%)", color: "#ffffff", border: "1px solid rgba(20, 184, 166, 0.3)", gridTemplateColumns: "1fr" }}>
          <div className="showcase-copy" style={{ width: "100%" }}>
            <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#ffffff", margin: "0 0 12px" }}>
              The more you use it, the more useful it becomes.
            </h2>
            <p style={{ fontSize: "1.1rem", color: "#ccfbf1", lineHeight: 1.62 }}>
              A folder full of PDFs doesn't become more useful just because you add another PDF. A structured timeline does.
            </p>
            <p style={{ fontSize: "1.05rem", color: "#ffffff", marginTop: "10px" }}>
              Every additional report can add another point to a metric's history. Over months and years, that creates a record that is increasingly difficult to reproduce with simple file storage.
            </p>
            <div style={{ marginTop: "24px", padding: "22px 26px", borderRadius: "20px", background: "rgba(204, 251, 241, 0.12)", border: "1px solid rgba(45, 212, 191, 0.3)", display: "flex", flexWrap: "wrap", justifyContent: "space-around", gap: "16px", textAlign: "center" }}>
              <div>
                <strong style={{ fontSize: "1.2rem", color: "#2dd4bf", display: "block" }}>Structured data</strong>
                <span style={{ fontSize: "0.85rem", color: "#e6fffa" }}>Canonical metrics & standardized units</span>
              </div>
              <div style={{ borderLeft: "1px solid rgba(255, 255, 255, 0.2)", paddingLeft: "20px" }}>
                <strong style={{ fontSize: "1.2rem", color: "#2dd4bf", display: "block" }}>Verifiable history</strong>
                <span style={{ fontSize: "0.85rem", color: "#e6fffa" }}>Direct original source lab provenance</span>
              </div>
              <div style={{ borderLeft: "1px solid rgba(255, 255, 255, 0.2)", paddingLeft: "20px" }}>
                <strong style={{ fontSize: "1.2rem", color: "#2dd4bf", display: "block" }}>Compounds over time</strong>
                <span style={{ fontSize: "0.85rem", color: "#e6fffa" }}>Multi-year, multi-provider timeline</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: The Question Behind the Report (Muted Mint-Teal Card) */}
        <section className="premium-section" style={{ background: "linear-gradient(145deg, #f0fdfa 0%, #ffffff 100%)", border: "1px solid rgba(15, 118, 110, 0.22)", boxShadow: "0 10px 32px rgba(15, 23, 42, 0.05)", color: "#042f2e", gridTemplateColumns: "1fr" }}>
          <div className="showcase-copy" style={{ width: "100%" }}>
            <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#042f2e", marginBottom: "16px" }}>
              We're building for the question behind the report.
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginTop: "16px", alignItems: "stretch" }}>
              {/* Left Card: Traditional Report View */}
              <div style={{ padding: "24px", borderRadius: "20px", background: "#ffffff", border: "1px solid rgba(239, 68, 68, 0.25)", boxShadow: "0 4px 16px rgba(239, 68, 68, 0.04)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#b91c1c", textTransform: "uppercase", letterSpacing: "0.04em", background: "rgba(239, 68, 68, 0.08)", padding: "4px 10px", borderRadius: "6px", width: "fit-content" }}>Traditional Report View</span>
                <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "#991b1b", margin: "4px 0 0" }}>
                  “What does this report say?”
                </p>
                <small style={{ color: "#7f1d1d", fontSize: "0.935rem", lineHeight: 1.5 }}>Static numbers locked inside isolated PDF files.</small>
              </div>

              {/* Right Card: Klario Connected History (A bit whiter UI) */}
              <div style={{ padding: "24px", borderRadius: "20px", background: "#ffffff", border: "1px solid rgba(20, 184, 166, 0.35)", boxShadow: "0 10px 28px rgba(20, 184, 166, 0.08)", display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.04em", background: "rgba(20, 184, 166, 0.12)", padding: "4px 10px", borderRadius: "6px", width: "fit-content" }}>Klario Connected History</span>
                <div style={{ display: "grid", gap: "8px", marginTop: "4px" }}>
                  {questionBehindReport.map((q) => (
                    <div key={q} style={{ fontSize: "0.98rem", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "10px", background: "linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)", padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(20, 184, 166, 0.18)" }}>
                      <span style={{ color: "#0d9488", fontWeight: 800 }}>➔</span> {q}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p style={{ marginTop: "24px", fontSize: "1.1rem", fontWeight: 800, color: "#0f766e" }}>
              That's what we want Klario to become.
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}


