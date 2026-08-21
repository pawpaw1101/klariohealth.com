import type { Metadata } from "next";
import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";
import type { KlarioIconName } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Product & Features",
  description: "From uploaded report to one clear health timeline. Klario turns fragmented medical reports into structured, verifiable health records."
};

const workflowSteps = [
  {
    step: "01",
    title: "Capture",
    body: "Upload medical documents through camera capture, your photo library, or PDF files. Single and batch uploads are supported with system-managed background processing."
  },
  {
    step: "02",
    title: "Structure",
    body: "OCR extracts the document layout, while Klario's deterministic parser identifies and standardizes health metrics, values, units, aliases, and reference ranges."
  },
  {
    step: "03",
    title: "Review",
    body: "Review structured results, automated flags, and lab-provided reference ranges before information becomes part of the health record."
  },
  {
    step: "04",
    title: "Track",
    body: "Analyze the same metrics across multiple testing dates with longitudinal charts, historical ranges, averages, latest values, and measurable changes (Week, Month, 6M, 1Y, and All)."
  }
];

const userSegments = [
  {
    title: "Recurring Lab Patients",
    body: "Track regular measurements such as HbA1c, lipids, and thyroid results across repeated tests."
  },
  {
    title: "Family Caregivers",
    body: "Manage health documentation for multiple dependents inside one organized household workspace."
  },
  {
    title: "Chronic Care Trackers",
    body: "Follow condition markers across months and years instead of reviewing each report in isolation."
  },
  {
    title: "Consolidated Archive Seekers",
    body: "Bring health documents from multiple providers into one independent health record layer."
  }
];



export default function FeaturesPage() {
  return (
    <main className="content premium-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-copy">
          <h1>From every medical report to one clear health timeline.</h1>
          <p className="hero-lead">
            Klario turns fragmented medical reports into structured, verifiable health records — making it easier to search, compare, and understand how health metrics change over time.
          </p>
          <div className="button-row">
            <Link className="button button-primary" href="/login">
              Try now / Download
              <BioIcon name="icon_action_continue" size={18} />
            </Link>
          </div>
        </div>

        {/* Hero Showcase Widget */}
        <div
          className="hero-showcase-widget"
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            padding: "28px",
            border: "1px solid rgba(20, 184, 166, 0.28)",
            boxShadow: "0 20px 48px rgba(15, 23, 42, 0.08)",
            color: "#0f172a",
            display: "flex",
            flexDirection: "column",
            gap: "18px"
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                <BioIcon name="icon_tab_trends" size={20} style={{ color: "#0f766e", backgroundColor: "#0f766e" }} />
              </span>
              <div>
                <strong style={{ fontSize: "1.05rem", color: "#0f172a", display: "block" }}>Longitudinal Timeline</strong>
                <span style={{ fontSize: "0.8rem", color: "#475569" }}>4 Reports Auto-Structured</span>
              </div>
            </div>
          </div>

          {/* Metric 1 Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)",
              borderRadius: "16px",
              padding: "16px 18px",
              border: "1px solid rgba(20, 184, 166, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.9rem", color: "#0f766e", fontWeight: 700 }}>HbA1c (Blood Sugar)</span>
              <span style={{ fontSize: "0.78rem", color: "#0f766e", fontWeight: 700, background: "rgba(20, 184, 166, 0.15)", padding: "3px 9px", borderRadius: "6px" }}>+0.2% ↗</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <span style={{ fontSize: "1.65rem", fontWeight: 800, color: "#0f172a" }}>5.8%</span>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>vs 5.6% (6 mos ago)</span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "#0f766e" }}>
              Reference Range: 4.0 - 5.6% · Quest Diagnostics (Oct 2025)
            </div>
          </div>

          {/* Metric 2 Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)",
              borderRadius: "16px",
              padding: "16px 18px",
              border: "1px solid rgba(20, 184, 166, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.9rem", color: "#0f766e", fontWeight: 700 }}>LDL Cholesterol</span>
              <span style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: 700, background: "rgba(22, 163, 74, 0.12)", padding: "3px 9px", borderRadius: "6px" }}>-15 mg/dL ↘</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <span style={{ fontSize: "1.65rem", fontWeight: 800, color: "#0f172a" }}>95 mg/dL</span>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>vs 110 mg/dL (Prev)</span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "#0f766e" }}>
              Optimal: &lt; 100 mg/dL · LabCorp (Jan 2026)
            </div>
          </div>
        </div>
      </section>

      <div className="premium-stack">
        {/* Section 1: Value Core (Slate Turquoise Card) */}
        <section className="premium-section premium-section-workflow">
          <div className="premium-section-copy">
            <h2>Every report has more meaning over time.</h2>
            <p>
              Medical results often live across disconnected PDFs, scans, and patient portals. Klario brings them together into an organized health record while preserving the original report, reference ranges, and lab context.
            </p>
          </div>
          <div className="workflow-steps">
            <div className="workflow-step">
              <span className="step-number">
                <BioIcon name="icon_tab_documents" size={20} />
              </span>
              <div className="step-content">
                <strong>Search</strong>
                <small>One organized record across report formats and sources.</small>
              </div>
            </div>
            <div className="workflow-step">
              <span className="step-number">
                <BioIcon name="icon_tab_trends" size={20} />
              </span>
              <div className="step-content">
                <strong>Compare</strong>
                <small>The same health metric aligned across testing dates.</small>
              </div>
            </div>
            <div className="workflow-step">
              <span className="step-number">
                <BioIcon name="icon_tab_family" size={20} />
              </span>
              <div className="step-content">
                <strong>Separate</strong>
                <small>Records for each member inside a household workspace.</small>
              </div>
            </div>
            <div className="workflow-step">
              <span className="step-number">
                <BioIcon name="icon_action_confirm_safe" size={20} />
              </span>
              <div className="step-content">
                <strong>Verify</strong>
                <small>Every value against its original report and lab context.</small>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Workflow "How it works" (Crisp White Card with Turquoise Step Badges) */}
        <section className="premium-section premium-section-showcase" style={{ gridTemplateColumns: "1fr" }}>
          <div className="showcase-copy" style={{ width: "100%" }}>
            <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              How it works
            </h2>
            <p className="showcase-lead" style={{ marginBottom: "28px" }}>
              Four steps from a medical document to a structured health timeline.
            </p>
            <div className="showcase-points" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
              {workflowSteps.map((step) => (
                <div key={step.step} className="showcase-point" style={{ flexDirection: "column", gap: "12px", padding: "22px" }}>
                  <span className="step-number" style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)", color: "#ffffff", width: "42px", height: "42px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem" }}>
                    {step.step}
                  </span>
                  <div>
                    <strong style={{ fontSize: "1.15rem", marginBottom: "6px" }}>{step.title}</strong>
                    <span>{step.body}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 7: Security Architecture */}
        <section
          className="premium-section"
          style={{
            gridTemplateColumns: "1fr",
            background: "linear-gradient(135deg, #042f2e 0%, #0f766e 100%)",
            color: "#ffffff",
            border: "1px solid rgba(45, 212, 191, 0.35)",
            boxShadow: "0 20px 48px rgba(4, 47, 46, 0.16)"
          }}
        >
          <div className="showcase-copy" style={{ width: "100%" }}>
            <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)", fontWeight: 800, color: "#ffffff", marginBottom: "8px" }}>
              Built with security in mind.
            </h2>
            <p className="showcase-lead" style={{ color: "#ccfbf1", marginBottom: "24px", maxWidth: "720px", fontSize: "1.1rem" }}>
              Health records require more than simple file storage. Klario's architecture is engineered around device-bound privacy and data provenance.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
              <div
                className="showcase-point"
                style={{
                  padding: "20px 22px",
                  borderRadius: "18px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start"
                }}
              >
                <span
                  className="showcase-point-icon showcase-point-icon-white"
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.28)",
                    border: "1px solid rgba(255, 255, 255, 0.45)",
                    color: "#ffffff",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <BioIcon name="icon_action_confirm_safe" size={22} style={{ color: "#ffffff", backgroundColor: "#ffffff" }} />
                </span>
                <div>
                  <strong style={{ color: "#ffffff", fontSize: "1.05rem", fontWeight: 700, marginBottom: "4px", display: "block" }}>
                    Device-bound Authentication
                  </strong>
                  <span style={{ color: "#ccfbf1", fontSize: "0.9rem", lineHeight: 1.5 }}>
                    Keychain-based token management helps prevent unauthorized credential migration.
                  </span>
                </div>
              </div>

              <div
                className="showcase-point"
                style={{
                  padding: "20px 22px",
                  borderRadius: "18px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start"
                }}
              >
                <span
                  className="showcase-point-icon showcase-point-icon-white"
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.28)",
                    border: "1px solid rgba(255, 255, 255, 0.45)",
                    color: "#ffffff",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <BioIcon name="icon_action_confirm_safe" size={22} style={{ color: "#ffffff", backgroundColor: "#ffffff" }} />
                </span>
                <div>
                  <strong style={{ color: "#ffffff", fontSize: "1.05rem", fontWeight: 700, marginBottom: "4px", display: "block" }}>
                    Biometric Protection
                  </strong>
                  <span style={{ color: "#ccfbf1", fontSize: "0.9rem", lineHeight: 1.5 }}>
                    Biometric app locking protects visible health data after periods of inactivity.
                  </span>
                </div>
              </div>

              <div
                className="showcase-point"
                style={{
                  padding: "20px 22px",
                  borderRadius: "18px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start"
                }}
              >
                <span
                  className="showcase-point-icon showcase-point-icon-white"
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.28)",
                    border: "1px solid rgba(255, 255, 255, 0.45)",
                    color: "#ffffff",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <BioIcon name="icon_action_confirm_safe" size={22} style={{ color: "#ffffff", backgroundColor: "#ffffff" }} />
                </span>
                <div>
                  <strong style={{ color: "#ffffff", fontSize: "1.05rem", fontWeight: 700, marginBottom: "4px", display: "block" }}>
                    Protected Document Access
                  </strong>
                  <span style={{ color: "#ccfbf1", fontSize: "0.9rem", lineHeight: 1.5 }}>
                    Documents use malware scanning and signed, expiring access URLs.
                  </span>
                </div>
              </div>

              <div
                className="showcase-point"
                style={{
                  padding: "20px 22px",
                  borderRadius: "18px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start"
                }}
              >
                <span
                  className="showcase-point-icon showcase-point-icon-white"
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.28)",
                    border: "1px solid rgba(255, 255, 255, 0.45)",
                    color: "#ffffff",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <BioIcon name="icon_action_confirm_safe" size={22} style={{ color: "#ffffff", backgroundColor: "#ffffff" }} />
                </span>
                <div>
                  <strong style={{ color: "#ffffff", fontSize: "1.05rem", fontWeight: 700, marginBottom: "4px", display: "block" }}>
                    Data Provenance
                  </strong>
                  <span style={{ color: "#ccfbf1", fontSize: "0.9rem", lineHeight: 1.5 }}>
                    Parser output, manual edits, and effective values are maintained separately for clearer data lineage.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: Target Market Segments (White Card) */}
        <section className="premium-section premium-section-showcase" style={{ gridTemplateColumns: "1fr" }}>
          <div className="showcase-copy" style={{ width: "100%" }}>
            <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              Built for people who need a longer view of their health.
            </h2>
            <div className="showcase-points" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px", marginTop: "24px" }}>
              {userSegments.map((segment) => (
                <div key={segment.title} className="showcase-point" style={{ padding: "20px" }}>
                  <span className="showcase-point-icon"><BioIcon name="icon_filter_metric" size={18} /></span>
                  <div>
                    <strong style={{ fontSize: "1.05rem", marginBottom: "4px" }}>{segment.title}</strong>
                    <span>{segment.body}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5 & 6: Family Workspace & Source Lineage (Crisp White Card) */}
        <section className="premium-section premium-section-showcase" style={{ gridTemplateColumns: "1fr" }}>
          <div className="showcase-copy" style={{ width: "100%" }}>
            <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              Your health records. Your family. One workspace.
            </h2>
            <p className="showcase-lead" style={{ marginBottom: "24px" }}>
              Create individual profiles for dependents, parents, and partners without mixing their health histories.
            </p>

            <div className="showcase-points" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginTop: "16px" }}>
              <div
                className="showcase-point"
                style={{
                  padding: "24px 26px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #042f2e 0%, #0f766e 100%)",
                  color: "#ffffff",
                  border: "1px solid rgba(45, 212, 191, 0.4)",
                  boxShadow: "0 12px 30px rgba(4, 47, 46, 0.18)",
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start"
                }}
              >
                <span
                  className="showcase-point-icon showcase-point-icon-white"
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.28)",
                    border: "1px solid rgba(255, 255, 255, 0.45)",
                    color: "#ffffff",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <BioIcon name="icon_tab_family" size={22} style={{ color: "#ffffff", backgroundColor: "#ffffff" }} />
                </span>
                <div>
                  <strong style={{ color: "#ffffff", fontSize: "1.15rem", fontWeight: 800, marginBottom: "4px", display: "block" }}>
                    Role-Based Access Control
                  </strong>
                  <span style={{ color: "#ccfbf1", fontSize: "0.935rem", lineHeight: 1.55 }}>
                    Supports Owners, Admins, Contributors, and Viewers with server-reverified permissions.
                  </span>
                </div>
              </div>

              <div
                className="showcase-point"
                style={{
                  padding: "24px 26px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #0d9488 0%, #042f2e 100%)",
                  color: "#ffffff",
                  border: "1px solid rgba(45, 212, 191, 0.4)",
                  boxShadow: "0 12px 30px rgba(4, 47, 46, 0.18)",
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start"
                }}
              >
                <span
                  className="showcase-point-icon showcase-point-icon-white"
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.28)",
                    border: "1px solid rgba(255, 255, 255, 0.45)",
                    color: "#ffffff",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <BioIcon name="icon_action_confirm_safe" size={22} style={{ color: "#ffffff", backgroundColor: "#ffffff" }} />
                </span>
                <div>
                  <strong style={{ color: "#ffffff", fontSize: "1.15rem", fontWeight: 800, marginBottom: "4px", display: "block" }}>
                    Contextual Source Lineage
                  </strong>
                  <span style={{ color: "#ccfbf1", fontSize: "0.935rem", lineHeight: 1.55 }}>
                    Original source document, parsed values, reference ranges, lab context, user corrections, and effective values preserved separately.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

