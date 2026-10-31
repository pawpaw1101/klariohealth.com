import Link from "next/link";

type LegalSection = { title: string; paragraphs: string[]; bullets?: string[] };

const privacySections: LegalSection[] = [
  {
    title: "Information we handle",
    paragraphs: [
      "When you create an account, we handle account details such as your name, email address, and sign-in and verification records.",
      "When you use Klario, you may provide health reports and images, extracted test names and results, dates and units, family profiles, and information about who may access a family profile. Health information can be sensitive. Please upload only information you are allowed to provide and share.",
      "We also process information needed to operate and protect the service, such as device and app details, session and security events, support messages, and push notification tokens if you enable notifications."
    ]
  },
  {
    title: "How we use information",
    paragraphs: [
      "We use this information to create and secure your account; store and display your reports and health history; extract and organize information from documents; provide family access you choose; sync your workspace; send account, security, and service messages; and troubleshoot, maintain, and protect Klario.",
      "Document extraction can be incomplete or incorrect. We show source documents and extracted results so you can review them. Klario is for organizing health information and education. It does not diagnose, treat, or replace advice from a qualified health professional."
    ]
  },
  {
    title: "Family profiles and sharing",
    paragraphs: [
      "A family profile is separate from a sign-in account. Information is made available to other accounts only through the family roles, links, or invitations configured in Klario. Account owners and people with access may be able to view or manage information according to their role.",
      "If you add another person’s information, you are responsible for having authority to do so and for choosing people who should have access. You can review family access in the app or website."
    ]
  },
  {
    title: "Service providers and disclosures",
    paragraphs: [
      "The Klario website is hosted on Vercel, which may process technical information such as connection and request data to deliver the site. The Klario API and health-record services run separately and may use Render for application hosting, Amazon S3 or Azure Blob Storage for uploaded files, Azure Document Intelligence for OCR, a configured email provider for account messages, and Apple Push Notification service when you enable notifications. The exact storage and email providers depend on the production configuration. Google processes sign-in information when you choose Google sign-in.",
      "We do not sell health information or use it to target advertising. We may disclose information when necessary to operate the service, protect users and Klario, comply with a valid legal obligation, or respond to an emergency as permitted by law."
    ]
  },
  {
    title: "Storage, devices, and cookies",
    paragraphs: [
      "Your Klario account is the authoritative copy of account and health-record information. The iOS app may keep a protected local cache for offline access and faster loading. Sign-in credentials are stored using the device’s secure credential storage. The website uses session storage for its short-lived access token and an HTTP-only cookie for session renewal.",
      "We use storage that is necessary to keep you signed in and operate the website. Google’s sign-in service may also process information under Google’s own privacy terms when you choose Google sign-in."
    ]
  },
  {
    title: "Retention and deletion",
    paragraphs: [
      "We keep account information while your account is active and as needed to provide the service, meet legal requirements, resolve disputes, and protect Klario. Reports you move to Recently Deleted can generally be restored during the configured recovery period, which is 30 days by default. After that, the report and related extracted data are scheduled for permanent removal.",
      "You can request account deletion from Account & Security in the app or website when available for your account. Family ownership or access relationships may need to be resolved first. Some information may remain for a limited time in backups or where retention is required by law or needed to protect the service."
    ]
  },
  {
    title: "Your choices and requests",
    paragraphs: [
      "You can review and update account and family information in Klario, manage family access, turn off optional push notifications in your device settings, and request account deletion through Account & Security. You can also contact us to ask about access, correction, or deletion of information. Rights and available choices depend on where you live and applicable law."
    ]
  },
  {
    title: "Security and changes",
    paragraphs: [
      "We use administrative, technical, and organizational measures intended to protect information. No online service or storage system can be guaranteed completely secure. If a reportable incident affects your information, we will provide notices when required by applicable law.",
      "We may update this policy as Klario changes. We will update the date on this page and provide additional notice when required."
    ]
  }
];

const termsSections: LegalSection[] = [
  {
    title: "Using Klario",
    paragraphs: [
      "Klario helps you store, organize, and review health reports and related information for yourself and family profiles you are authorized to manage. You must provide accurate account information, protect your sign-in credentials, and be responsible for activity under your account.",
      "You may add another person’s information only when you have the authority and any permission required to do so. Use family access controls carefully and remove access when it is no longer appropriate."
    ]
  },
  {
    title: "Health information is not medical advice",
    paragraphs: [
      "Klario is an organizational and educational tool, not a healthcare provider or emergency service. It does not diagnose conditions or recommend treatment. Information extracted from a report may be delayed, incomplete, or inaccurate. Review the original report and consult a qualified health professional before making health decisions.",
      "Do not use Klario to seek emergency help. Contact local emergency services or a healthcare professional for urgent concerns."
    ]
  },
  {
    title: "Your content and acceptable use",
    paragraphs: [
      "You retain your rights in content you provide. You give Klario permission to host, process, display, and transmit that content only as needed to operate, secure, and provide the features you use, including document extraction and family sharing you choose.",
      "Do not misuse Klario, interfere with its operation, attempt to access another person’s account or data without permission, upload content unlawfully, or use the service to provide medical care unless separately authorized under a written agreement."
    ]
  },
  {
    title: "Service availability and account closure",
    paragraphs: [
      "We may update, suspend, or discontinue parts of Klario to maintain or improve the service, address security or legal issues, or respond to misuse. You may stop using Klario and request account deletion through the available account controls. Some family relationships may need to be resolved before deletion can proceed.",
      "These terms do not promise uninterrupted availability or error-free document extraction."
    ]
  },
  {
    title: "Privacy and third-party services",
    paragraphs: [
      "Google sign-in and other third-party services are also subject to their own terms and privacy notices."
    ]
  },
  {
    title: "Disclaimers and liability",
    paragraphs: [
      "To the extent permitted by applicable law, Klario is provided without warranties beyond those that cannot legally be excluded. Nothing in these terms limits rights or remedies that cannot be limited under the law that applies to you.",
      "To the extent permitted by applicable law, Klario will not be liable for indirect or consequential loss arising from use of the service. These terms do not exclude liability that cannot legally be excluded."
    ]
  },
  {
    title: "Changes and contact",
    paragraphs: [
      "We may revise these terms when the service or legal requirements change. We will post the current version here and update the date above. Continued use after revised terms take effect means you accept them where applicable law allows.",
      "Questions about these terms? Contact us at support@klariohealth.com."
    ]
  }
];

export function LegalDocument({ kind }: { kind: "privacy" | "terms" }) {
  const isPrivacy = kind === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";
  const sections = isPrivacy ? privacySections : termsSections;

  return (
    <main className="content legal-page">
      <header className="legal-page-header">
        <p className="legal-eyebrow">Klario · Legal</p>
        <h1>{title}</h1>
        <p className="legal-updated">Last updated October 31, 2026</p>
      </header>
      <aside className="legal-draft-notice">
        <strong>Draft for review</strong>
        <span>Website hosting on Vercel is confirmed. The legal operator’s registered name and location, plus the exact production storage and email providers, still need confirmation before this is final legal text.</span>
      </aside>
      {isPrivacy ? (
        <p className="legal-intro">This policy describes how Klario handles information when you use the Klario website and app to organize health reports and family health profiles.</p>
      ) : (
        <p className="legal-intro">These terms describe the basic rules for using Klario’s website and app. By creating an account or using the service, you agree to follow them.</p>
      )}
      <nav className="legal-toc" aria-label="Legal documents">
        <Link aria-current={isPrivacy ? "page" : undefined} href="/privacy">Privacy Policy</Link>
        <Link aria-current={!isPrivacy ? "page" : undefined} href="/terms">Terms of Service</Link>
      </nav>
      <div className="legal-sections">
        {sections.map((section, index) => (
          <section className="legal-section" key={section.title}>
            <h2>{index + 1}. {section.title}</h2>
            {section.title === "Privacy and third-party services" ? (
              <p>The <Link href="/privacy">Privacy Policy</Link> explains how Klario handles information. {section.paragraphs[0]}</p>
            ) : section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
          </section>
        ))}
      </div>
      <p className="legal-contact">Questions? Email <a href="mailto:support@klariohealth.com">support@klariohealth.com</a>.</p>
    </main>
  );
}
