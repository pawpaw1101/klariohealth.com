"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";
import { appMetrics, biomarkerTrends, documents, familyProfiles, timelineEvents, uploadMethods } from "@/lib/klario-data";
import { PageTitle, SectionHeader } from "@/components/section";

export function DashboardWorkspace() {
  const [activeProfile, setActiveProfile] = useState("Joel");
  const profileDocuments = documents.filter((document) => document.owner === activeProfile || activeProfile === "All");
  const needsReview = documents.filter((document) => document.status === "Needs review");

  return (
    <>
      <PageTitle title="Dashboard" body={`Family health workspace for ${activeProfile === "All" ? "everyone" : activeProfile}.`} />
      <div className="workspace-bar">
        <div>
          <span className="control-label">Active profile</span>
          <div className="profile-pills" role="list" aria-label="Family profiles">
            {["All", ...familyProfiles.slice(0, 4).map((profile) => profile.name)].map((profile) => (
              <button key={profile} className={`pill-button${activeProfile === profile ? " is-active" : ""}`} type="button" onClick={() => setActiveProfile(profile)}>
                {profile}
              </button>
            ))}
          </div>
        </div>
        <Link className="button button-primary" href="/app/upload">
          <BioIcon name="icon_doc_add_empty" size={17} />
          Add report
        </Link>
      </div>

      <section className="metric-grid" aria-label="Workspace summary">
        {appMetrics.map((metric) => (
          <article className="metric" key={metric.label}>
            <span className="metric-number">{metric.value}</span>
            <h3>{metric.label}</h3>
            <p>{metric.body}</p>
          </article>
        ))}
      </section>

      <section className="section">
        <SectionHeader title="Needs review" intro="Values that should be confirmed before they become part of the longitudinal record." />
        <div className="record-list">
          {needsReview.map((document) => (
            <article className="record record-with-action" key={document.title}>
              <div>
                <h3>{document.title}</h3>
                <p>{document.source}. {document.summary}</p>
              </div>
              <Link className="button button-secondary" href="/app/documents">Review report</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Recent documents" intro="The list updates instantly as you switch family profiles." />
        <div className="record-list">
          {profileDocuments.slice(0, 3).map((document) => (
            <article className="record" key={`${document.owner}-${document.title}`}>
              <div className="record-meta">
                <span>{document.owner}</span>
                <span>{document.date}</span>
                <span className={statusClass(document.status)}>{document.status}</span>
              </div>
              <h3>{document.title}</h3>
              <p>{document.source}. {document.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export function DocumentsWorkspace() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const statusOptions = ["All", "Needs review", "Watch", "Saved"];

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return documents.filter((document) => {
      const matchesStatus = status === "All" || document.status === status;
      const haystack = `${document.title} ${document.source} ${document.owner} ${document.summary} ${document.tags.join(" ")}`.toLowerCase();
      return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [query, status]);

  return (
    <>
      <PageTitle title="Documents" body="Uploaded reports and parsed files for the current family workspace." />
      <div className="workspace-bar">
        <label className="search-field">
          <span className="sr-only">Search documents</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reports, labs, people" />
        </label>
        <div className="filter-group" aria-label="Filter documents">
          <BioIcon name="icon_filter_status" size={18} />
          {statusOptions.map((option) => (
            <button key={option} className={`pill-button${status === option ? " is-active" : ""}`} type="button" onClick={() => setStatus(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>

      <section className="record-list">
        {filteredDocuments.map((document) => (
          <article className="record document-record" key={`${document.owner}-${document.title}`}>
            <div className="record-meta">
              <span>{document.owner}</span>
              <span>{document.date}</span>
              <span className={statusClass(document.status)}>{document.status}</span>
            </div>
            <h3>{document.title}</h3>
            <p>{document.source}. {document.summary}</p>
            <div className="tag-row">
              {document.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
            <div className="button-row compact">
              <Link className="button button-secondary" href="/app/trends">View trend</Link>
              <Link className="button button-ghost" href="/app/timeline">Open timeline</Link>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

export function UploadWorkspace() {
  const [selectedIndex, setSelectedIndex] = useState(2);
  const [member, setMember] = useState("Joel");
  const [fileName, setFileName] = useState("");
  const selectedIcon = uploadIcons[selectedIndex] ?? "icon_doc_generic";
  const selected = uploadMethods[selectedIndex];

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.files?.[0]?.name ?? "");
  };

  return (
    <>
      <PageTitle title="Add document" body="Choose how to capture a medical report." />
      <div className="workspace-bar">
        <label className="select-field">
          <span className="control-label">Assign to</span>
          <select value={member} onChange={(event) => setMember(event.target.value)}>
            {familyProfiles.map((profile) => <option key={profile.name}>{profile.name}</option>)}
          </select>
        </label>
        <span className="status-chip is-info">Parsing destination: {member}</span>
      </div>

      <section className="upload-layout">
        <div className="grid two-column-grid">
          {uploadMethods.map((method, index) => {
            const iconName = uploadIcons[index] ?? "icon_doc_generic";
            return (
              <button key={method.title} className={`upload-method card${index === selectedIndex ? " is-active" : ""}`} type="button" onClick={() => setSelectedIndex(index)}>
                <span className="feature-icon" aria-hidden="true"><BioIcon name={iconName} size={24} /></span>
                <span>
                  <strong>{method.title}</strong>
                  <small>{method.body}</small>
                </span>
              </button>
            );
          })}
        </div>

        <aside className="interactive-panel upload-panel">
          <span className="feature-icon" aria-hidden="true"><BioIcon name={selectedIcon} size={26} /></span>
          <h2>{selected.title}</h2>
          <p>{selected.body}</p>
          <label className="drop-zone">
            <input type="file" onChange={onFileChange} />
            <span>{fileName || "Choose a report file"}</span>
          </label>
          <button className="button button-primary" type="button">
            <BioIcon name="icon_action_confirm_safe" size={17} />
            Start parsing
          </button>
          <p className="note">Klario will extract values into a review queue before anything is saved.</p>
        </aside>
      </section>
    </>
  );
}

export function TimelineWorkspace() {
  return (
    <>
      <PageTitle title="Timeline" body="Longitudinal health history for Joel." />
      <section className="timeline-list">
        {timelineEvents.map((event) => (
          <article className="timeline-item" key={`${event.date}-${event.title}`}>
            <span>{event.date}</span>
            <h3>{event.title}</h3>
            <p>{event.body}</p>
          </article>
        ))}
      </section>
    </>
  );
}

export function TrendsWorkspace() {
  const [activeName, setActiveName] = useState(biomarkerTrends[0].name);
  const active = biomarkerTrends.find((trend) => trend.name === activeName) ?? biomarkerTrends[0];

  return (
    <>
      <PageTitle title="Trends" body="Longitudinal biomarkers for Joel." />
      <section className="trends-layout">
        <div className="interactive-panel trend-detail">
          <div className="record-meta">
            <span className={statusClass(active.status)}>{active.status}</span>
            <span>{active.range}</span>
          </div>
          <h2>{active.name}</h2>
          <p className="trend-value">{active.value} <span>{active.unit}</span></p>
          <Sparkline points={active.points} />
          <p>{active.description}</p>
        </div>
        <div className="grid trend-card-grid">
          {biomarkerTrends.map((trend) => (
            <button key={trend.name} className={`card trend-card${active.name === trend.name ? " is-active" : ""}`} type="button" onClick={() => setActiveName(trend.name)}>
              <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_tab_trends" size={22} /></span>
              <h3>{trend.name}</h3>
              <p><strong>{trend.value} {trend.unit}</strong></p>
              <p>{trend.range}. {trend.points.length} data points.</p>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

export function FamilyWorkspace() {
  const [activeName, setActiveName] = useState(familyProfiles[0].name);
  const active = familyProfiles.find((profile) => profile.name === activeName) ?? familyProfiles[0];

  return (
    <>
      <PageTitle title="Family" body="Manage reports for each member of the household, including pets." />
      <div className="workspace-bar">
        <div>
          <span className="control-label">Selected profile</span>
          <strong>{active.name}</strong>
          <p>{active.role}. {active.detail}.</p>
        </div>
        <button className="button button-primary" type="button">
          <BioIcon name="icon_family_add" size={17} />
          Add profile
        </button>
      </div>

      <section className="grid two-column-grid">
        {familyProfiles.map((profile) => (
          <button key={profile.name} className={`card profile-card${active.name === profile.name ? " is-active" : ""}`} type="button" onClick={() => setActiveName(profile.name)}>
            <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_tab_family" size={24} /></span>
            <h3>{profile.name}</h3>
            <p>{profile.role}. {profile.detail}.</p>
            <span className="status-chip">{profile.documents} documents</span>
          </button>
        ))}
        <article className="card profile-card add-card">
          <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_family_add" size={24} /></span>
          <h3>Add family member</h3>
          <p>Create a new profile before importing documents.</p>
          <button type="button">Add profile</button>
        </article>
      </section>
    </>
  );
}

export function AccountWorkspace() {
  return (
    <>
      <PageTitle title="Profile" body="Account controls, privacy settings, and workspace details." />
      <section className="grid two-column-grid">
        <PreferenceCard icon="icon_signal_confidence" title="Account" body="Manage email, password, and account access." action="Manage account" />
        <PreferenceCard icon="icon_action_confirm_safe" title="Privacy" body="Records stay private and are not shared without consent." action="Review privacy" />
        <PreferenceCard icon="icon_tab_family" title="Family workspace" body="Choose the active family member for uploads, trends, and timeline views." action="Open family" href="/app/family" />
        <PreferenceCard icon="icon_doc_warning" title="Support" body="Send feedback or ask for help with an uploaded report." action="Contact support" />
      </section>
    </>
  );
}

export function SettingsWorkspace() {
  const [settings, setSettings] = useState({
    notifications: true,
    smartReview: true,
    securityAlerts: true,
    educationalNotice: true
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <>
      <PageTitle title="Settings" body="Preferences for notifications, imports, security, and family records." />
      <section className="grid two-column-grid">
        <ToggleCard icon="icon_signal_warning" title="Notifications" body="Reminders for reviews, repeat tests, and follow-up items." checked={settings.notifications} onToggle={() => toggle("notifications")} />
        <ToggleCard icon="icon_filter_status" title="Import preferences" body="Default family member, file source, and review behavior." checked={settings.smartReview} onToggle={() => toggle("smartReview")} />
        <ToggleCard icon="icon_action_confirm_safe" title="Security" body="Session access and account protection." checked={settings.securityAlerts} onToggle={() => toggle("securityAlerts")} />
        <ToggleCard icon="icon_signal_confidence" title="Educational notice" body="Klario helps organize and understand records. It is not medical advice." checked={settings.educationalNotice} onToggle={() => toggle("educationalNotice")} />
      </section>
    </>
  );
}

const uploadIcons = ["icon_doc_add_empty", "icon_doc_choose_file", "icon_doc_generic", "icon_doc_import_panel", "icon_sync_local", "icon_family_header"];

function statusClass(status: string) {
  if (status === "Needs review" || status === "Low") return "status-chip is-warning";
  if (status === "Watch") return "status-chip is-info";
  return "status-chip is-success";
}

function Sparkline({ points }: { points: number[] }) {
  const width = 340;
  const height = 128;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const spread = max - min || 1;
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - ((point - min) / spread) * (height - 28) - 14;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const area = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Biomarker trend chart">
      <path d={area} className="sparkline-area" />
      <path d={path} className="sparkline-line" />
      {points.map((point, index) => {
        const x = (index / Math.max(points.length - 1, 1)) * width;
        const y = height - ((point - min) / spread) * (height - 28) - 14;
        return <circle key={`${point}-${index}`} cx={x} cy={y} r="4" />;
      })}
    </svg>
  );
}

function PreferenceCard({ icon, title, body, action, href }: {
  icon: string;
  title: string;
  body: string;
  action: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="feature-icon" aria-hidden="true"><BioIcon name={icon} size={24} /></span>
      <h3>{title}</h3>
      <p>{body}</p>
      <span className="inline-action">{action}</span>
    </>
  );

  if (href) {
    return <Link className="card preference-card" href={href}>{content}</Link>;
  }

  return <article className="card preference-card">{content}</article>;
}

function ToggleCard({ icon, title, body, checked, onToggle }: {
  icon: string;
  title: string;
  body: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="card preference-card">
      <span className="feature-icon" aria-hidden="true"><BioIcon name={icon} size={24} /></span>
      <h3>{title}</h3>
      <p>{body}</p>
      <button className={`toggle-control${checked ? " is-on" : ""}`} type="button" role="switch" aria-checked={checked} onClick={onToggle}>
        <span />
      </button>
    </article>
  );
}
